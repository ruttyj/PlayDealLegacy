import React from "react";

import { getNestedValue, els } from "../utils/";

import BaseDealCard from "../components/cards/BaseDealCard";
import CashCard from "../components/cards/CashCard";
import PropertyCard from "../components/cards/PropertyCard";
import PropertyWildCard from "../components/cards/PropertyWildCard";
import SuperWildCard from "../components/cards/SuperWildCard";
import DoubleTheRent from "../components/cards/DoubleTheRent";
import StealCollectionCard from "../components/cards/StealCollectionCard";
import StealPropertyCard from "../components/cards/StealPropertyCard";
import SwapPropertyCard from "../components/cards/SwapPropertyCard";
import JustSayNoCard from "../components/cards/JustSayNoCard";
import DebtCollectorCard from "../components/cards/DebtCollectorCard";
import ItsMyBirthdayCard from "../components/cards/ItsMyBirthdayCard";
import PassGoCard from "../components/cards/PassGoCard";
import RentCard from "../components/cards/RentCard";
import HouseCard from "../components/cards/HouseCard";
import HotelCard from "../components/cards/HotelCard";

const RenderCard = ({
  card,
  propertySetMap,
  propertySets,
  onActiveSetChange,
  style = {},
}) => {
  propertySetMap = els(propertySetMap, propertySets);

  let content = "";
  let cardTags = getNestedValue(card, "tags", []);
  switch (card.type) {
    case "cash":
      content = <CashCard card={card} style={style} />;
      break;
    case "property":
      if (card.class === "concreteProperty") {
        content = (
          <PropertyCard
            card={card}
            propertySets={propertySetMap}
            style={style}
          />
        );
      } else if (card.class === "wildPropertyAll") {
        content = <SuperWildCard style={style} />;
      } else if (card.class === "wildPropertyLimited") {
        content = (
          <PropertyWildCard
            card={card}
            propertySets={propertySetMap}
            onActiveSetChange={onActiveSetChange}
            style={style}
          />
        );
      }
      break;
    case "action":
      switch (card.class) {
        case "stealCollection":
          content = <StealCollectionCard card={card} style={style} />;
          break;
        case "stealProperty":
          content = <StealPropertyCard card={card} style={style} />;
          break;
        case "swapProperty":
          content = <SwapPropertyCard card={card} style={style} />;
          break;
        case "justSayNo":
          content = <JustSayNoCard card={card} style={style} />;
          break;
        case "draw":
          content = <PassGoCard card={card} style={style} />;
          break;
        case "rentAugment":
          content = <DoubleTheRent card={card} style={style} />;
          break;
        case "setAugment":
          if (cardTags.includes("hotel"))
            content = <HotelCard card={card} style={style} />;
          else if (cardTags.includes("house"))
            content = <HouseCard card={card} style={style} />;
          break;
        case "collection":
          if (cardTags.includes("rent")) {
            content = (
              <RentCard
                colors={card.sets}
                target={card.target}
                card={card}
                propertySets={propertySetMap}
                style={style}
              />
            );
          } else if (cardTags.includes("debtCollection")) {
            content = (
              <DebtCollectorCard
                card={card}
                propertySets={propertySetMap}
                style={style}
              />
            );
          } else if (cardTags.includes("itsMyBirthday")) {
            content = (
              <ItsMyBirthdayCard
                card={card}
                propertySets={propertySetMap}
                style={style}
              />
            );
          }
          break;
        default:
      }
      break;
    default:
      content = <BaseDealCard style={style} />;
  }
  return content;
};

export default RenderCard;
