function buildOrderedTree() {
    let itemField = 'items';
    let orderField = 'order';

    /**
     * Ordered Tree
     * 
     * A tree structure build from ordered maps
     */
    class OrderedTree {
        constructor() {
            this.mRoot = this.newNode();
        }

        newNode()
        {
            return new Map();
        }

        _isNode(mxd)
        {
            return mxd instanceof Map;
        }

        set(mxdPath, value)
        {
            let path = Array.isArray(mxdPath) ? mxdPath : [mxdPath];
            let ref = this.mRoot;
            for(let i = 0; i < path.length; ++i){
                let part = path[i];
                let isLast = i == path.length - 1;

                if (isLast) {
                    ref.set(part, value);
                } else {
                    if (!ref.has(part) || !this._isNode(ref.get(part))) {
                        ref.set(part, this.newNode());
                        ref = ref.get(part);
                    } else {
                        ref = ref.get(part);
                    }
                }
            }
        }

        delete(mxdPath, value)
        {
            let path = Array.isArray(mxdPath) ? mxdPath : [mxdPath];
            let ref = this.mRoot;
            let failed = false;
            for(let i = 0; i < path.length; ++i){
                if (!failed) {
                    let part = path[i];
                    let isLast = i == path.length - 1;

                    if (isLast) {
                        ref.delete(part, value);
                    } else {
                        if (!ref.has(part) || !this._isNode(ref.get(part))) {
                            failed = true;
                        } else {
                            ref = ref.get(part);
                        }
                    }
                }
            }
        }

        get(mxdPath, fallback=undefined)
        {
            let path = Array.isArray(mxdPath) ? mxdPath : [mxdPath];
            let ref = this.mRoot;
            let failed = false;
            for(let i = 0; i < path.length; ++i){
                if (!failed) {
                    let part = path[i];
                    let isLast = i == path.length - 1;

                    if (isLast) {
                        return ref.get(part);
                    } else {
                        if (!ref.has(part) || !this._isNode(ref.get(part))) {
                            failed = true;
                        } else {
                            ref = ref.get(part);
                        }
                    }
                }
            }

            return fallback;
        }

        has(mxdPath)
        {
            let path = Array.isArray(mxdPath) ? mxdPath : [mxdPath];
            let ref = this.mRoot;
            let failed = false;
            for(let i = 0; i < path.length; ++i){
                if (!failed) {
                    let part = path[i];
                    let isLast = i == path.length - 1;

                    if (isLast) {
                        return ref.has(part);
                    } else {
                        if (!ref.has(part) || !this._isNode(ref.get(part))) {
                            failed = true;
                        } else {
                            ref = ref.get(part);
                        }
                    }
                }
            }

            return !failed;
        }

        serialize() 
        {
            let _isNode = this._isNode;
            function _recursive(ref) {
                let result = {
                    [itemField]:  {},
                    [orderField]: [],
                };
                ref.forEach((value, key) => {
                    if (_isNode(value)) {
                        result[itemField][key] = _recursive(value);
                    } else {
                        result[itemField][key] = value;
                    }
                    result[orderField].push(key);

                })
                return result;
            }

            return _recursive(this.mRoot);
        }
    }
    return OrderedTree;
}

module.exports = buildOrderedTree;