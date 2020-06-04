import React, { useState } from "react";
import { Flex, FlexRow, FlexColumn } from "../components/Flex";
import { Dump } from "../components/Dump";

import {
  ImmutableHookBasedSet,
  ImmutableClassBasedSet,
  ImmutableHookBasedList,
  ImmutableClassBasedList,
  ImmutableHookBasedObject,
  ImmutableClassBasedObject
} from "../utils/ReactStateTools";

class TestClass extends React.Component {
  constructor(props, context) {
    super(props, context);
    let initialState = {};
    this.testMap = ImmutableClassBasedObject(this, ["testMap"]);
    this.testSet = ImmutableClassBasedSet(this, ["testSet"]);
    this.testList = ImmutableClassBasedList(this, ["testList"]);
    this.testList.setNormalizeFn(String);
    this.testSet.setNormalizeFn(String);

    this.state = initialState;
  }

  render() {
    return (
      <FlexColumn>
        {/* ------ Class based state Set ------ */}
        <FlexColumn>
          <Flex>
            <h2>Class based state Set</h2>
          </Flex>
          <FlexRow>
            <button onClick={() => this.testSet.add(++topId)}>Push</button>
            <button onClick={() => this.testSet.add(25)}>Add 25</button>
            <button onClick={() => this.testSet.removeIndex(0)}>
              Remove Index 0
            </button>
            <button onClick={() => this.testSet.removeValue(25)}>
              Remove 25
            </button>
            <button onClick={() => this.testSet.pop()}>Pop</button>
            <button onClick={() => this.testSet.clear()}>Clear</button>
          </FlexRow>
          <FlexColumn>
            <Dump value={this.testSet.has(25)} title="has value 25" />
            <Dump value={this.testSet.getAll()} />
          </FlexColumn>
        </FlexColumn>

        {/* ------ Class Based State List ------ */}
        <FlexColumn>
          <Flex>
            <h2>Class Based State List</h2>
          </Flex>
          <FlexRow>
            <button onClick={() => this.testList.add(++topId)}>Push</button>
            <button onClick={() => this.testList.add(25)}>Add 25</button>
            <button onClick={() => this.testList.removeIndex(0)}>
              Remove Index 0
            </button>
            <button onClick={() => this.testList.removeValue(25)}>
              Remove 25
            </button>
            <button onClick={() => this.testList.pop()}>Pop</button>
            <button onClick={() => this.testList.clear()}>Clear</button>
          </FlexRow>
          <FlexColumn>
            <Dump value={this.testList.has(25)} title="has value 25" />
            <Dump value={this.testList.getAll()} />
          </FlexColumn>
        </FlexColumn>

        {/* ------ Class Based State Object ------ */}
        <FlexColumn>
          <Flex>
            <h2>Class Based State Object</h2>
          </Flex>
          <FlexRow>
            <button onClick={() => this.testMap.set(++topId, `Value_${topId}`)}>
              Push
            </button>
            <button onClick={() => this.testMap.set(25, `Value_${25}`)}>
              Add 25
            </button>
            <button onClick={() => this.testMap.remove(25)}>
              Remove key 25
            </button>
            <button
              onClick={() => this.testMap.remove(this.testMap.firstKey())}
            >
              Remove first
            </button>

            <button onClick={() => this.testMap.remove(this.testMap.lastKey())}>
              Remove last
            </button>

            <button onClick={() => this.testMap.removeValue(`Value_${25}`)}>
              Remove Value_25
            </button>
            <button onClick={() => this.testMap.clear()}>Clear</button>
          </FlexRow>
          <FlexColumn>
            <Dump value={this.testMap.has(25)} title="has key 25" />
            <Dump
              value={this.testMap.hasValue(`Value_${25}`)}
              title={`has value Value_${25}`}
            />
            <Dump value={this.testMap.getAll()} />
          </FlexColumn>
        </FlexColumn>
      </FlexColumn>
    );
  }
}

let topId = 0;
export default () => {
  let testMap = ImmutableHookBasedObject(useState);
  let testSet = ImmutableHookBasedSet(useState);
  let testList = ImmutableHookBasedList(useState);
  testList.setNormalizeFn(String);
  testSet.setNormalizeFn(String);

  return (
    <div style={{ padding: "50px" }}>
      <FlexColumn>
        <FlexRow>
          {/* ------ CLass based tests ------ */}
          <TestClass />
        </FlexRow>

        {/* ------ Hook based state Set ------ */}
        <FlexColumn>
          <Flex>
            <h2>Hook based state Set</h2>
          </Flex>
          <FlexRow>
            <button onClick={() => testSet.add(++topId)}>Push</button>
            <button onClick={() => testSet.add(25)}>Add 25</button>
            <button onClick={() => testSet.removeIndex(0)}>
              Remove Index 0
            </button>
            <button onClick={() => testSet.removeValue(25)}>Remove 25</button>
            <button onClick={() => testSet.pop()}>Pop</button>
            <button onClick={() => testSet.clear()}>Clear</button>
          </FlexRow>
          <FlexColumn>
            <Dump value={testSet.has(25)} title="has value 25" />
            <Dump value={testSet.getAll()} />
          </FlexColumn>
        </FlexColumn>

        {/* ------ Hook Based State List ------ */}
        <FlexColumn>
          <Flex>
            <h2>Hook Based State List</h2>
          </Flex>
          <FlexRow>
            <button onClick={() => testList.add(++topId)}>Push</button>
            <button onClick={() => testList.add(25)}>Add 25</button>
            <button onClick={() => testList.removeIndex(0)}>
              Remove Index 0
            </button>
            <button onClick={() => testList.removeValue(25)}>Remove 25</button>
            <button onClick={() => testList.pop()}>Pop</button>
            <button onClick={() => testList.clear()}>Clear</button>
          </FlexRow>
          <FlexColumn>
            <Dump value={testList.has(25)} title="has value 25" />
            <Dump value={testList.getAll()} />
          </FlexColumn>
        </FlexColumn>

        {/* ------ Hook Based State Object ------ */}
        <FlexColumn>
          <Flex>
            <h2>Hook Based State Object</h2>
          </Flex>
          <FlexRow>
            <button onClick={() => testMap.set(++topId, `Value_${topId}`)}>
              Push
            </button>
            <button onClick={() => testMap.set(25, `Value_${25}`)}>
              Add 25
            </button>
            <button onClick={() => testMap.remove(25)}>Remove key 25</button>
            <button onClick={() => testMap.remove(testMap.firstKey())}>
              Remove first
            </button>

            <button onClick={() => testMap.remove(testMap.lastKey())}>
              Remove last
            </button>

            <button onClick={() => testMap.removeValue(`Value_${25}`)}>
              Remove Value_25
            </button>
            <button onClick={() => testMap.clear()}>Clear</button>
          </FlexRow>
          <FlexColumn>
            <Dump value={testMap.has(25)} title="has key 25" />
            <Dump
              value={testMap.hasValue(`Value_${25}`)}
              title={`has value Value_${25}`}
            />
            <Dump
              title="filter for key 25"
              value={testMap.filter((item, key) => String(key) === "25")}
            />
            <Dump
              title={`filter for value Value_${25}`}
              value={testMap.filter((item, key) => item === `Value_${25}`)}
            />
            <Dump
              title={`filter keyed for value Value_${25}`}
              value={testMap.filterKeyed((item, key) => item === `Value_${25}`)}
            />
            <Dump value={testMap.getAll()} />
          </FlexColumn>
        </FlexColumn>
      </FlexColumn>
    </div>
  );
};
