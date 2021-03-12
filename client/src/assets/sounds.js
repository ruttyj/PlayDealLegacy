import { Howl, Howler } from "howler";
import { isDef, makeMap, stateSerialize } from "../utils/";

function Sound({
  src,
  rate = 1,
  overlap = 50,
  loop = false,
  volume = 0.5,
  sprite = null,
  fade = [],
}) {
  const mState = {};
  const mExcludeKeys = [];
  let mSound;
  let mSettings = makeMap(mState, "settings");

  mSettings.set("rate", rate);
  mSettings.set("overlap", overlap);
  mSettings.set("loop", loop);
  mSettings.set("limit", 1);
  mSettings.set("count", 0);
  mSettings.set("volume", volume);
  mSettings.set("sprite", sprite);
  mSettings.set("spriteKey", null);
  mSettings.set("fade", fade);

  mSettings.set("src", src);
  _updateSound();

  function _updateSound() {
    mSound = new Howl({
      src: mSettings.get("src"),
      rate: rate,
      sprite: mSettings.get("sprite"),
      volume: mSettings.get("volume"),
      loop: mSettings.get("loop"),
      preload: true,
      onplay() {
        const duration = mSound._duration;
        mSettings.inc("count");
        if (mSettings.get("count") < mSettings.get("limit")) {
          setTimeout(() => {
            _play();
          }, (duration * 1000 * mSettings.get("overlap")) / 100);
        }
      },
    });
  }

  function serialize() {
    let result = stateSerialize(mState, mExcludeKeys);
    return result;
  }

  function _play() {
    let spriteKey = mSettings.get("spriteKey");
    if (isDef(spriteKey)) {
      mSound.play(spriteKey);
    } else {
      mSound.play();
    }
  }

  function _stop() {
    mSound.stop();
  }

  function stop() {
    _stop();
  }

  function play(num = 1, spriteKey = null) {
    mSettings.set("count", 0);
    mSettings.set("limit", num);
    mSettings.set("spriteKey", spriteKey);
    _play();
  }

  const mPublicInterface = {
    serialize,
    play,
    stop,
  };

  function getPublic() {
    return mPublicInterface;
  }

  return getPublic();
}

let notification = Sound({
  src: "/audio/notification.mp3",
  rate: 1,
  overlap: 50,
  volume: 0.5,
});

let confirmSprite2 = Sound({
  src: "/audio/confirm_sprite_2.mp3",
  sprite: {
    normal: [10500, 11500, false],
  },
  rate: 1,
  overlap: 50,
  volume: 0.5,
});

let confirmSprite1 = Sound({
  src: "/audio/confirm_sprite.mp3",
  sprite: {
    notice: [0, 1000, false],
    chime: [1500, 2000, false],
  },
  rate: 1,
  overlap: 50,
  volume: 0.05,
});



let booSprite = Sound({
  src: "/audio/booo.mp3",
  sprite: {
    normal: [0, 4000, false],
  },
  rate: 1,
  overlap: 50,
  volume: 0.4,
});

let birthdaySprite = Sound({
  src: "/audio/birthday_trumpets.mp3",
  sprite: {
    normal: [0, 2000, false],
  },
  rate: 1,
  overlap: 50,
  volume: 0.2,
});

let volume = 1;
let sounds = {
  setVolume(num) {
    if (num <= 1) {
      volume = Math.min(Math.max(0, num), 1); // decimal
    } else {
      volume = Math.min(Math.max(0, num / 100), 1); // percent
    }
    Howler.volume(volume);
  },
  getVolume() {
    return volume;
  },
  notification,
  endTurn: Sound({
    src: "audio/end_turn.wav",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  swipe: Sound({
    src: "/audio/swipe.mp3",
    rate: 1,
    overlap: 100,
    volume: 0.5,
  }),
  drawCard: Sound({
    src: "/audio/play_card.wav",
    rate: 1.5,
    overlap: 100,
    volume: 0.5,
  }),

  theyDrewCard: Sound({
    src: "/audio/play_card.wav",
    rate: 1.5,
    overlap: 100,
    volume: 0.2,
  }),
  chaChing: Sound({
    src: "/audio/cash.mp3",
    rate: 1.2,
    overlap: 50,
    volume: 0.5,
  }),
  build: Sound({
    src: "/audio/power_tools.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.1,
  }),
  playcard: Sound({
    src: "/audio/play_card.wav",
    rate: 1.5,
    overlap: 50,
    volume: 0.5,
  }),
  shuffle: Sound({
    src: "/audio/cards/shuffle/card_shuffle_07.mp3",
    rate: 1,
    overlap: 50,
    volume: 1,
  }),
  quietEvilLaugh: Sound({
    src: "/audio/nich_laugh.wav",
    rate: 1.2,
    overlap: 50,
    volume: 0.05,
  }),
  evilLaugh: Sound({
    src: "/audio/nich_laugh.wav",
    rate: 1.2,
    overlap: 50,
    volume: 0.5,
  }),
  shuffle: Sound({
    src: "/audio/deck_shuffle.wav",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),

  hmm: Sound({
    src: "/audio/hmm.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.1,
  }),
  hmm: Sound({
    src: "/audio/hmm.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.1,
  }),
  putBack: Sound({
    src: "/audio/keystroke.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.1,
  }),
  not_bad: Sound({
    src: "/audio/not_bad.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  boo: {
    play(num = 1) {
      booSprite.play(num, "normal");
    }
  },
  birthday: {
    play(num = 1) {
      birthdaySprite.play(num, "normal");
    },
  },
  yourTurn: {
    play(num = 1) {
      confirmSprite2.play(num, "normal");
    },
  },
  debtCollectors: Sound({
    src: "/audio/knocking_on_door.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  newRequest: Sound({
    src: "/audio/click_1.wav",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  stealProperty: Sound({
    src: "/audio/mistake_1.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  awww: Sound({
    src: "/audio/awww.mp3",
    rate: 1,
    overlap: 50,
    volume: 1,
  }),
  quietAcceptChime: {
    play(num = 1) {
      confirmSprite1.play(num, "chime");
    },
  },
  buttonClick: Sound({
    src: "/audio/cheep_1.wav",
    rate: 1,
    overlap: 50,
    volume: 0.1,
  }),
  buttonHover: Sound({
    src: "/audio/cheep_2.wav",
    rate: 1,
    overlap: 50,
    volume: 0.1,
  }),

  buttonDisabled: Sound({
    src: "/audio/cyber_error_1.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.3,
  }),

  startGame: Sound({
    src: "/audio/beauty_intro.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  joinRoom: Sound({
    src: "/audio/join_room.mp3",
    rate: 1,
    overlap: 50,
    volume: 0.5,
  }),
  introMusic: Sound({
    src: "/audio/music/kids-in-club.mp3",
    rate: 1,
    loop: true,
    overlap: 100,
    volume: 0.5,
  }),
  farting: Sound({
    src: "/audio/reactions/farting.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
    sprite: {
      v1: [0, 1000, false],
      v2: [1500, 3000, false],
      v3: [4000, 5000, false],
    },
  }),
  love_to: Sound({
    src: "/audio/reactions/love_to.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
  }),
  oh_pretty_please: Sound({
    src: "/audio/reactions/oh_pretty_please.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
  }),
  na_na: Sound({
    src: "/audio/reactions/na-na.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
    sprite: {
      main: [0, 1750, false],
    },
  }),
  na_na_poo_poo: Sound({
    src: "/audio/reactions/na-na-na-na-poo-poo.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
  }),

  super_genius: Sound({
    src: "/audio/reactions/super-genius.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.4,
  }),

  wise_guy_eh: Sound({
    src: "/audio/reactions/wise-guy-eh.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
  }),

  shazaam: Sound({
    src: "/audio/reactions/shazaam.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 1,
  }),

  whats_the_big_idea: Sound({
    src: "/audio/reactions/whats-the-big-idea.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
  }),
  annoying_excuse_me: Sound({
    src: "/audio/reactions/annoying-excuse-me.mp3",
    rate: 1,
    loop: false,
    overlap: 100,
    volume: 0.5,
  }),
};


export default sounds;
