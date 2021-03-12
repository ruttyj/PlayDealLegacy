import React, {useState} from "react";

const useCachedSize = () => {
    const [cachedWidth, setCachedWidth] = useState(undefined);
    const [cachedHeight, setCachedHeight] = useState(undefined);

    let internalSize = {
        width: cachedWidth,
        height: cachedHeight,
    };

    function process({width, height}){
        if (width !== cachedWidth && width !== undefined){
            setCachedWidth(width);
            internalSize.width = width;
        }
        if (height !== cachedHeight && height !== undefined){
            setCachedHeight(height);
            internalSize.height = height;
        }
        return get();
    }

    function get(){
        return {...internalSize};
    }

    return {
        process,
        get,
        getWidth:   () => internalSize.width,
        getHeight:  () => internalSize.height,
    }
}

export default useCachedSize;