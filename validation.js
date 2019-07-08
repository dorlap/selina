const validateHelper = date => {
    const ret = new Date(date)
    ret.setHours(0);
    ret.setMinutes(0);
    ret.setSeconds(0);
    ret.setMilliseconds(0);
    return ret;
}

exports.validateDate = (start, end) => {
    const _start = validateHelper(start);
    const _end = validateHelper(end);
    if (isNaN(_start) || isNaN(_end)) {
        return false;
    }

    const today = validateHelper(Date.now());
    if (_start < today) {
        return false;
    }

    if (_start > _end) {
        return false;
    }
    return true;
};