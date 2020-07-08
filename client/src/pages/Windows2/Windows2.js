import React from "react";

import AppSidebar from "../../packages/ReactWindows/Components/SideBar/";

import { useState, useEffect } from "../../packages/ReactWindows/Exports/";
import PhotoSizeSelectActualIcon from "@material-ui/icons/PhotoSizeSelectActual";
import BugReportIcon from "@material-ui/icons/BugReport";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import AddIcon from "@material-ui/icons/Add";
import PublicIcon from "@material-ui/icons/Public";

import { classes } from "../../utils/";
function PageComponent() {
  return (
    <div style={{ backgroundColor: "white", color: "black" }}>
      <AppSidebar>
        <div {...classes("button")}>
          <EmojiPeopleIcon />
        </div>

        <div {...classes("button")}>
          <PhotoSizeSelectActualIcon />
        </div>
        <div {...classes("button")}>
          <BugReportIcon />
        </div>
        <div {...classes("button")}>
          <BugReportIcon />
        </div>
        <div {...classes("button")}>
          <AddIcon />
        </div>
        <div {...classes("button")}>
          <AddIcon />
        </div>

        <div {...classes("button")}>
          <AddIcon />
        </div>
        <div {...classes("button")}>
          <AddIcon />
        </div>

        <div {...classes("button")}>
          <PublicIcon />
        </div>
      </AppSidebar>
      sidebar Hello
    </div>
  );
}
export default PageComponent;
