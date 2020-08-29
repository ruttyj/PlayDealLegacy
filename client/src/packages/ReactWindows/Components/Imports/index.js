import React, { useState, useEffect } from "react";
import Utils from "../../Utils/";
import {
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
  motionValue,
  Override,
} from "framer-motion";
import AddIcon from "@material-ui/icons/Add";
import FillContainer from "../../Components/Containers/FillContainer/FillContainer";
import FillContent from "../../Components/Containers/FillContainer/FillContent";
import FillHeader from "../../Components/Containers/FillContainer/FillHeader";
import FillFooter from "../../Components/Containers/FillContainer/FillFooter";
import DragWindow from "../../Components/Containers/Windows/DragWindow/";
import WindowContainer from "../../Components/Containers/Windows/WindowContainer/";
import DragListH from "../../Components/Containers/DragListH/";
import DragListV from "../../Components/Containers/DragListV/";
import SizeBackgroundColor from "../../Components/Containers/SizeBackgroundColor/";
import StateBuffer from "../../Utils/StateBuffer";
import BlurredWrapper from "../../Components/Containers/BlurredWrapper/";
import AppSidebar from "../../Components/TopLevel/AppSizebar/";
import AppHeader from "../../Components/TopLevel/AppHeader/";
import WindowManager from "../../Utils/WindowManager";
import BugReportIcon from "@material-ui/icons/BugReport";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import ArrowToolTip from "../../Components/Containers/ArrowToolTip/";
import wallpapers from "../../Data/Wallpapers";
import wallpaperNames from "../../Data/WallpaperNames";
import PhotoSizeSelectActualIcon from "@material-ui/icons/PhotoSizeSelectActual";
import TextField from "@material-ui/core/TextField";
import PublicIcon from "@material-ui/icons/Public";
import {
  createDebugger,
  createTrooperIframe,
  createWindowA,
  createWallpaperWindow,
} from "../../Pages/Home/CreateWindow";
import "../../Pages/Home/Home.scss";

export {
  React,
  useState,
  useEffect,
  Utils,
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
  motionValue,
  Override,
  AddIcon,
  FillContainer,
  FillContent,
  FillHeader,
  FillFooter,
  DragWindow,
  WindowContainer,
  DragListH,
  DragListV,
  StateBuffer,
  BlurredWrapper,
  AppSidebar,
  AppHeader,
  WindowManager,
  BugReportIcon,
  EmojiPeopleIcon,
  ArrowToolTip,
  wallpapers,
  wallpaperNames,
  PhotoSizeSelectActualIcon,
  TextField,
  PublicIcon,
  createDebugger,
  createTrooperIframe,
  createWindowA,
  createWallpaperWindow,
  SizeBackgroundColor,
};
