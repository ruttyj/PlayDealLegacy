import React, { useState } from "react";
const ShakeAnimationWrapper = ({ children, value = false, triggerValue = null }) => {
  const [previousValue, setPreviousValue] = useState(triggerValue);
  const [isShakeing, _setIsShaking] = useState(false);

  function startShaking() {
    _setIsShaking(true);
    setTimeout(() => {
      _setIsShaking(false);
    }, 500);
  }
  if (triggerValue !== previousValue) {
    startShaking();
    setPreviousValue(triggerValue);
  }

  let className = isShakeing || value ? "shake" : "";
  return (
    <div className={className} style={{ display: "inline-flex" }}>
      {children}
    </div>
  );
};

export default ShakeAnimationWrapper;
