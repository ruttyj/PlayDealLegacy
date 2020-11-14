module.exports = function ({OrderedTree}) {

    /**
     * Affected
     * Stores info about affected entities and respective ids
     * Can be used to:
     *  Tell if entity type was affected
     *  Tell if specific id of an entity was affected
     *  Get the list of ids affected
     */
    class Affected {
        constructor() {
            this.mRoot = new OrderedTree();
        }
        
        static get ACTION() {
            return {
                CREATE: 'create',
                UPDATE: 'update',
                DELETE: 'delete',
            };
        }
    
        static get ACTION_GROUP() {
            let actions = this.ACTION;
            return {
                CHANGE: [actions.CREATE, actions.UPDATE],
                REMOVE: [actions.DELETE],
            };
        }

        hasNested(path) {
            return this.mRoot.has(path);
        }

        getKeys(path) {
            let result = [];
            let children = this.mRoot.get(path, null);
            if (children !== null) {
                children.forEach((value, key) => {
                    result.push(key);
                })
            }
            return result;
        }

        getNested(path, fallback=undefined) {
            return this.mRoot.get(path, fallback);
        }
        
        setAffected(entityKey, id=0, action=null) {
            // Log that the entity was affected
            if (!this.mRoot.has([entityKey, id])) {
                this.mRoot.set([entityKey, id], this.mRoot.newNode());
            }

            // log the action 
            if (action !== null) {
                let actionPath = [entityKey, id, action];
                if (!this.mRoot.has(actionPath)) {
                    this.mRoot.set(actionPath, true);
                }
            }
        }
        
        isAffected(entityKey)
        {
            return this.wasEntityAffected(entityKey);
        }

        wasEntityAffected(entityKey) {
            return this.hasNested([entityKey]);
        }

        wasIdAffected(entityKey, id=0) {
            return this.hasNested([entityKey, id]);
        }

        getIdsAffected(entityKey) {
            if (this.wasEntityAffected(entityKey)) {
                return this.getKeys([entityKey]);
            }
            return [];
        }

        getIdsAffectedByAction(entityKey, mxdActions) {
            let actions = Array.isArray(mxdActions) ? mxdActions : [mxdActions];

            let idsAffected = this.getIdsAffected(entityKey);
            return idsAffected.filter(id => {
                for (let i=0; i < actions.length; ++i) {
                    let action = actions[i];
                    if (this.mRoot.has([entityKey, id, action])) {
                        return true;
                    }
                }
                return false;
            })
        }

        serialize() 
        {
            return this.mRoot.serialize();
        }
    }

    return Affected;
}