import _ from "lodash";

export default class AsyncValidate {
    constructor(value, customFn) {
        this.value = value;
        this.customFn = customFn;
    }

    valueOf() {
        return this.value;
    }

    toString() {
        return `${this.value}`;
    }

    equals(other, comparator = (a, b) => _.isEqual(a, b)) {
        if (!(other instanceof AsyncValidate)) {
            return false;
        }
        return comparator(this.value, other.value);
    }
}
