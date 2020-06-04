import React, { useState } from "react";
import { Flex, FlexRow, FlexColumn } from "../components/Flex";
import { Dump } from "../components/Dump";

import { connect } from "react-redux";

import { AbstractImmutableObject } from "../utils/ReactStateTools";
import { devController } from "../App/controllers/devController";

let topId = 0;
const MyFunctionComponent = props => {
  let eProps = devController.expandActionProps(props);
  return (
    <div style={{ padding: "50px" }}>
      <FlexColumn>
        {/* ------ Store Based State Object ------ */}
        <Flex>
          <h2>Store Based State Object</h2>
          <FlexColumn>
            <button onClick={() => eProps.fruit.set(25, `Value_${25}`)}>
              Set Item
            </button>
            <button onClick={() => eProps.fruit.set(++topId, `Value_${topId}`)}>
              Add Item
            </button>
          </FlexColumn>
        </Flex>

        <FlexColumn>
          <Dump value={eProps} />
        </FlexColumn>
      </FlexColumn>
    </div>
  );
};

const mapStateToProps = state => ({
  ...devController.getters(state)
});
const mapDispatchToProps = {
  ...devController.actions()
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyFunctionComponent);
