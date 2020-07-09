import React from "react";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";

import {
  Flex,
  FlexRow,
  FlexColumn,
  FlexColumnCenter,
  FlexRowCenter,
  FlexCenter,
  FullFlexCenter,
  FullFlexColumn,
  FullFlexColumnCenter,
  FullFlexRow,
  FullFlexRowCenter,
} from "../../components/Flex";

function IntroContainer(props) {
  let { content, actions } = props;
  return (
    <Card
      className="input-container"
      style={{ maxWidth: "400px", pointerEvents: "all" }}
    >
      <CardActionArea>
        <CardMedia
          className="card-media"
          style={{
            height: "200px",
            backgroundImage:
              "linear-gradient(45deg, #820773, #1c026c 40%, #0087d6)",
            color: "white",
          }}
        >
          <FullFlexColumnCenter>{content}</FullFlexColumnCenter>
        </CardMedia>
        <CardContent>
          <FullFlexRowCenter>{actions}</FullFlexRowCenter>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default IntroContainer;
