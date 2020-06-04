import React, { useState } from "react";

import sounds from "../assets/sounds";

import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import DragItem from "../components/dragNDrop/DragItem";
import DropZone from "../components/dragNDrop/DropZone";
import PropertySetContainer from "../components/panels/playerPanel/PropertySetContainer";
import RenderInteractableCard from "../components/RenderInteractableCard";
import RenderCard from "../components/RenderCard";

import CashCard from "../components/cards/CashCard";
import PropertyCard from "../components/cards/PropertyCard";
import PropertyWildCard from "../components/cards/PropertyWildCard";
import SuperWildCard from "../components/cards/SuperWildCard";
import HotelCard from "../components/cards/HotelCard";
import HouseCard from "../components/cards/HouseCard";
import DoubleTheRent from "../components/cards/DoubleTheRent";

import StealCollectionCard from "../components/cards/StealCollectionCard";
import StealPropertyCard from "../components/cards/StealPropertyCard";
import SwapPropertyCard from "../components/cards/SwapPropertyCard";
import JustSayNoCard from "../components/cards/JustSayNoCard";
import DebtCollectorCard from "../components/cards/DebtCollectorCard";
import ItsMyBirthdayCard from "../components/cards/ItsMyBirthdayCard";
import PassGoCard from "../components/cards/PassGoCard";
import TrumpCard from "../components/cards/TrumpCard";
import RentCard from "../components/cards/RentCard";
import BaseDealCard from "../components/cards/BaseDealCard";
import {
  ImmutableHookBasedObject,
  ImmutableHookBasedSet,
} from "../utils/ReactStateTools";
import MyHandContainer from "../components/panels/playerPanel/MyHandContainer";

import MonsterRebornCard from "../components/cards/MonsterRebornCard";

//#################################################################

import { makeStyles } from "@material-ui/core/styles";

import cards from "../data/cards";
import propertySets from "../data/propertySets";
import ShakeAnimationWrapper from "../components/effects/Shake";

export default () => {
  let state = ImmutableHookBasedObject(useState, {
    triggerValue: false,
    mode: "normal",
    selectionType: "add",
    isSelectable: true,
    isSelected: false,
    cardSelectionEnabled: false,
    collectionSelectionEnabled: false,
  });

  return (
    <DndProvider backend={Backend}>
      <div style={{ width: "100%", height: "100%", backgroundColor: "grey" }}>
        <MonsterRebornCard card={{ value: 4 }} />
        {cards.order.map((cardId) => {
          let card = cards.items[cardId];
          return (
            <div style={{ display: "inline-flex" }} key={cardId}>
              {cardId}
              <br />
              <RenderCard
                key={cardId}
                style={{ margin: "4px" }}
                card={card}
                propertySetMap={propertySets.items}
              />
            </div>
          );
        })}
      </div>
    </DndProvider>
  );
};
