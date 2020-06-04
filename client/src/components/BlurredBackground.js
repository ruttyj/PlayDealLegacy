import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const BlurredBackground = ({ onClick, children, blur = 15, disabled = false, backgroundImage }) => {
  const styles = makeStyles(theme => ({
    parent: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: "black",
      height: "100%",
      width: "100%"
    },
    blurred: {
      content: "",
      display: "block",
      height: "-webkit-fill-available",
      overflow: "hidden",
      width: "100%",
      position: "absolute",
      transform: "scale(1.1)",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      opacity: "0.8",
      filter: `blur(${blur}px)`
    }
  }));
  const classes = styles();

  return (
    <div className={classes.parent}>
      <div
        className={classes.blurred}
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      {children}
    </div>
  );
};

export default BlurredBackground;
