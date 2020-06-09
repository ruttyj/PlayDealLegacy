import React, { useState } from "react";

import sounds from "../assets/sounds";

import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import DragItem from "../components/dragNDrop/DragItem";
import DropZone from "../components/dragNDrop/DropZone";
import PropertySetContainer from "../components/panels/playerPanel/PropertySetContainer";
import RenderInteractableCard from "../components/RenderInteractableCard";
import RenderCard from "../components/RenderCard";
import {
  ImmutableHookBasedObject,
  ImmutableHookBasedSet,
} from "../utils/ReactStateTools";
import MyHandContainer from "../components/panels/playerPanel/MyHandContainer";

//#################################################################

import { makeStyles } from "@material-ui/core/styles";

import cards from "../data/cards";
import propertySets from "../data/propertySets";
import ShakeAnimationWrapper from "../components/effects/Shake";

const styles = makeStyles((theme) => ({
  root: {
    backgroundColor: "#333",
    color: "white",
    height: "100%",
  },
}));

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

  let collectionSelectableIds = ImmutableHookBasedSet(useState, [55]);
  let collectionSelectedIds = ImmutableHookBasedSet(useState, []);

  let cardSelectableIds = ImmutableHookBasedSet(useState, [50, 60, 3]);
  let cardSelectedIds = ImmutableHookBasedSet(useState, []);

  const classes = styles();

  let handDefaultScale = 25;
  let handHoverScale = 27;

  const handleOnCardDrop = (...args) => {
    console.log("handleOnCardDrop", ...args);
  };

  const triggerShake = () =>
    state.set("triggerValue", !state.get("triggerValue", false));

  const toggleCardSelectionEnabled = () =>
    state.set(
      "cardSelectionEnabled",
      !state.get("cardSelectionEnabled", false)
    );
  const toggleCollectionSelectionEnabled = () =>
    state.set(
      "collectionSelectionEnabled",
      !state.get("collectionSelectionEnabled", false)
    );

  const toggleSelected = () =>
    state.set("isSelected", !state.get("isSelected", false));
  const toggleSelectable = () =>
    state.set("isSelectable", !state.get("isSelectable", false));
  const toggleMode = () =>
    state.set(
      "mode",
      state.get("mode", "normal") === "normal" ? "select" : "normal"
    );
  const toggleSelectionType = () =>
    state.set(
      "selectionType",
      state.get("selectionType", "add") === "add" ? "remove" : "add"
    );

  let myHandIds = [40, 50, 60, 70, 80];

  let renderMyHand = myHandIds.map((cardId) => {
    let card = cards.items[cardId];
    return (
      <RenderInteractableCard
        key={card.id}
        scaledPercent={60}
        card={card}
        dragProps={{
          type: "MY_CARD",
          cardId: card.id,
          card: card,
          from: "hand",
        }}
        selectionEnabled={state.get("cardSelectionEnabled", false)}
        propertySetMap={propertySets.items}
        highlightIsSelectable={true}
        isSelectable={cardSelectableIds.has(card.id)}
        selectType={"add"}
        isSelected={cardSelectedIds.has(card.id)}
        onSelected={({ cardId, card }) => {
          if (cardSelectableIds.has(card.id)) {
            cardSelectedIds.toggle(card.id);
          }
        }}
        notApplicable={false}
      />
    );
  });

  return (
    <DndProvider backend={Backend}>
      <div className={classes.root}>
        <button onClick={() => sounds.notification.play(1)}>
          Notification
        </button>
        <button onClick={() => sounds.introMusic.play(1)}>
          introMusic start
        </button>
        <button onClick={() => sounds.introMusic.stop()}>
          introMusic stop
        </button>
        <button onClick={() => sounds.swipe.play(1)}>swipe</button>
        <button onClick={() => sounds.shuffle.play()}>shuffle</button>
        <button onClick={() => sounds.evilLaugh.play()}>evilLaugh</button>
        <button onClick={() => sounds.endTurn.play()}>endTurn</button>
        <button onClick={() => sounds.chaChing.play(2)}>chaChing</button>
        <button onClick={() => sounds.build.play(1)}>build</button>
        <button onClick={() => sounds.hmm.play(1)}>hmm</button>
        <button onClick={() => sounds.booo.play(1)}>booo</button>
        <button onClick={() => sounds.not_bad.play(1)}>not_bad</button>
        <button onClick={() => sounds.awww.play(1)}>awww</button>
        <button onClick={() => sounds.buttonHover.play(1)}>buttonHover</button>
        <button onClick={() => sounds.buttonClick.play(1)}>buttonClick</button>
        <button onClick={() => sounds.joinRoom.play(1)}>joinRoom</button>
        <button onClick={() => sounds.quietAcceptChime.play(1)}>
          quietAcceptChime
        </button>
        <button onClick={() => sounds.buttonDisabled.play(1)}>
          buttonDisabled
        </button>
        <button onClick={() => sounds.startGame.play(1)}>start_game_1</button>
        <button onClick={() => sounds.newRequest.play(1)}>newRequest</button>
        <button onClick={() => sounds.debtCollectors.play(1)}>
          debtCollectors
        </button>
        <button onClick={() => sounds.birthday.play(1, "normal")}>
          birthday
        </button>
        <button onClick={() => sounds.yourTurn.play(1)}>yourTurn</button>
        <button
          onClick={() => {
            sounds.playcard.play(2);
          }}
        >
          playcard
        </button>
        <br />
        <button onClick={toggleSelectable}>Toggle isSelectable</button>
        <button onClick={toggleSelected}>Toggle isSelected</button>
        <button onClick={toggleMode}>Toggle mode</button>
        <button onClick={toggleSelectionType}>
          Toggle toggleSelectionType
        </button>
        <br />
        <br />
        <br />
        <button onClick={toggleCardSelectionEnabled}>
          Toggle toggleCardSelectionEnabled
        </button>
        <button onClick={toggleCollectionSelectionEnabled}>
          Toggle toggleCollectionSelectionEnabled
        </button>
        <br />
        collectionSelectionEnabled{" "}
        {state.get("collectionSelectionEnabled", false) ? "TRUE" : "FALSE"}
        <br />
        cardSelectionEnabled {state.get("cardSelectionEnabled", false)}
        <br />
        isSelectable: {state.get("isSelectable", false) ? "TRUE" : "FALSE"}
        <br />
        isSelected:{state.get("isSelected", false) ? "TRUE" : "FALSE"}
        <br />
        mode:{state.get("mode")}
        <br />
        selectionType:{state.get("selectionType")}
        <br />
        collectionSelectableIds.has(55)
        {collectionSelectableIds.has(55) ? "TRUE" : "FALSE"}
        <br />
        collectionSelectedIds.has(55)
        {collectionSelectedIds.has(55) ? "TRUE" : "FALSE"}
        <br />
        <button onClick={triggerShake}>Toggle triggerShake</button>
        triggerShake {state.get("triggerValue", false) ? "TRUE" : "FALSE"}
        <br />
        {JSON.stringify(collectionSelectableIds.getAll())}
        <div style={{ padding: "100px" }}>
          <ShakeAnimationWrapper
            triggerValue={state.get("triggerValue", false)}
          >
            <RenderCard
              card={cards.items[3]}
              dragProps={{
                type: "MY_CARD",
                from: "collection",
              }}
              propertySetMap={propertySets.items}
            />
          </ShakeAnimationWrapper>
          <br />

          <DropZone
            accept={"MY_CARD"}
            onDrop={handleOnCardDrop}
            dropProps={{
              isEmptySet: false,
              isCollection: true,
            }}
          >
            <PropertySetContainer
              collectionId={55}
              selectType={state.get("selectionType")}
              selectionEnabled={state.get("collectionSelectionEnabled", false)}
              isSelectable={collectionSelectableIds.has(55)}
              isSelected={collectionSelectedIds.has(55)}
              onSelected={(...args) => {
                collectionSelectedIds.toggle(55);
              }}
              cards={[
                <RenderInteractableCard
                  card={cards.items[3]}
                  dragProps={{
                    type: "MY_CARD",
                    from: "collection",
                  }}
                  selectionEnabled={state.get("cardSelectionEnabled", false)}
                  isSelectable={cardSelectableIds.has(cards.items[3].id)}
                  isSelected={cardSelectedIds.has(cards.items[3].id)}
                  scaledPercent={handDefaultScale}
                  hoverPercent={handHoverScale}
                  propertySetMap={propertySets.items}
                  onSelected={({ cardId, card }) => {
                    if (cardSelectableIds.has(card.id)) {
                      cardSelectedIds.toggle(card.id);
                    }
                  }}
                />,
              ]}
            />
          </DropZone>

          <MyHandContainer>{renderMyHand}</MyHandContainer>
        </div>
      </div>
    </DndProvider>
  );
};
