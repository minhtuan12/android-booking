import multer from "multer";
import {UUID_TRANSLATOR} from "@/utils";
import {FileUpload} from "@/utils/types";

const defaultMulter = multer({
    storage: multer.memoryStorage(),
});

export default function upload(req, res, next) {
    const newNext = function (err) {
        if (err) {
            next(err);
        }

        try {
            const files = req.files;

            if (files) {
                for (let file of files) {
                    file.originalname = UUID_TRANSLATOR.generate();
                    const fieldname = file.fieldname;

                    if (req.body[fieldname]) {
                        if (Array.isArray(req.body[fieldname])) {
                            req.body[fieldname].push(new FileUpload(file));
                        } else {
                            req.body[fieldname] = [req.body[fieldname], new FileUpload(file)];
                        }
                    } else {
                        req.body[fieldname] = new FileUpload(file);
                    }
                }

                delete req.files;
            }

            next();
        } catch (error) {
            next(error);
        }
    };

    defaultMulter.any()(req, res, newNext);
}
