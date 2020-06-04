import React, { useState } from "react";
import { isDef, isDefNested } from "../utils/";
import HandCardWrapper from "../components/HandCardWrapper";
import RenderCard from "../components/RenderCard";
import ScaleCard from "../components/cards/ScaleCard";
import DragItem from "../components/dragNDrop/DragItem";
import CheckLayer from "../components/layers/CheckLayer";

const RenderInteractableCard = ({
  children,
  style = {},
  card,
  cardMode = "CARD",
  overlap = null,
  onActiveSetChange,
  propertySetMap,
  notApplicable = false,
  scaledPercent = 45,
  hoverPercent = 90,
  dragProps = {},
  highlightIsSelectable = false,
  selectionEnabled = false,
  isSelectable = false,
  selectType = "add",
  isSelected = false,
  clickProps = {},
  append = "",
  onSelected = () => {},
  onClick = () => {},
}) => {
  let content = (
    <RenderCard
      card={card}
      propertySetMap={propertySetMap}
      onActiveSetChange={onActiveSetChange}
    />
  );
  let cardId = isDefNested(card, "id") ? card.id : 0;
  return (
    <HandCardWrapper
      style={style}
      overlap={overlap}
      onClick={() => onClick({ cardId, card, ...clickProps })}
    >
      <ScaleCard percent={scaledPercent} hoverPercent={hoverPercent}>
        <DragItem item={{ type: cardMode, ...dragProps }}>
          <div key={cardId} style={{ display: "inline-flex" }}>
            <CheckLayer
              append={append}
              disabled={!selectionEnabled}
              isSelectable={isSelectable}
              notApplicable={notApplicable}
              value={isSelected}
              success={selectType === "add"}
              onClick={() => {
                if (isSelectable) {
                  onSelected({ cardId, card, isSelected, ...clickProps });
                }
              }}
            >
              {children}
              {content}
            </CheckLayer>
          </div>
        </DragItem>
      </ScaleCard>
    </HandCardWrapper>
  );
};

export default RenderInteractableCard;
