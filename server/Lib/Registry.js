module.exports = function ({
    isStr,
    isArr,
    isDef,
}) {
    return class Registry {
        constructor()
        {
            this.PRIVATE_SUBJECTS = {};
            this.PUBLIC_SUBJECTS  = {};
        }
    
        public(identifier, fn)
        {
            if(isStr(identifier)) {
                identifier = String(identifier).split('.');
            }
            if (isArr(identifier)) {
                let [subject, action] = identifier;
                if (!isDef(this.PUBLIC_SUBJECTS[subject])){
                    this.PUBLIC_SUBJECTS[subject] = {};
                }
                this.PUBLIC_SUBJECTS[subject][action] = fn;
            }
        }
    
        private(identifier, fn)
        {
            if(isStr(identifier)) {
                identifier = String(identifier).split('.');
            }
            if (isArr(identifier)) {
                let [subject, action] = identifier;
                if (!isDef(this.PRIVATE_SUBJECTS[subject])){
                    this.PRIVATE_SUBJECTS[subject] = {};
                }
                
                this.PRIVATE_SUBJECTS[subject][action] = fn;
            }
        }
    
        getAllPublic()
        {
            return this.PUBLIC_SUBJECTS;
        }
    
        getAllPrivate()
        {
            return this.PRIVATE_SUBJECTS;
        }
    }
}