import { JOI_DEFAULT_MESSAGE, JOI_DEFAULT_OPTIONS, responseError } from "@/utils";
import { AsyncValidate, FileUpload } from "@/utils/types";
import _ from "lodash";

async function validate(req, field, schema) {
    let errorDetails = {};

    async function dfs(variable) {
        if (variable instanceof AsyncValidate) {
            variable = await variable.customFn(req);
            if (!!variable?.prefs) {
                errorDetails[variable.path.join(".")] = `${variable}`;
            }
        } else if (typeof variable === "object" && variable !== null && !(variable instanceof FileUpload)) {
            for (const key in variable) {
                if (typeof variable[key] !== "string" && typeof variable[key] !== "number") {
                    variable[key] = await dfs(variable[key]);
                }
            }
        }

        return variable;
    }

    let { value, error } = schema.messages(JOI_DEFAULT_MESSAGE).validate(req[field], {
        ...JOI_DEFAULT_OPTIONS,
        context: {
            data: _.cloneDeep(req[field]),
        },
    });

    if (error) {
        errorDetails = error.details.reduce(function (pre, curr) {
            pre[curr.path.join(".")] = curr.message;
            return pre;
        }, errorDetails);
    }

    value = await dfs(value);

    return [value, errorDetails];
}

export default function (requestValidation) {
    const fields = ["query", "body", "cookies", "signedCookies"];

    return async function (req, res, next) {
        let details = {};

        for (let field of fields) {
            if (field in requestValidation) {
                const [value, error] = await validate(req, field, requestValidation[field]);
                details = {...details, ...error};
                req[field] = value;
            }
        }

        if (Object.keys(details).length > 0) {
            return responseError(res, 400, "Validation Error", details);
        }

        return next();
    };
}
