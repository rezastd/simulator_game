#!/usr/bin/env python3
"""Build 10 new simulator games from one reproducible source.

Usage:  python3 tools/build_new_games.py
Writes: <game>/index.html (x10), index.html hub cards, README.md rows,
        test/functional-test.js APPS list, tools/shoot_new_games.js,
        tools/make_contact.py
Screenshots + contact sheet come from:  node tools/shoot_new_games.js
"""
import os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- game data
# shape: quad|bird|human|blob|fish|face|bug|plant|prop(+ptype)
# facts: <=110 chars. more: one extra fact per subject.
GAMES = [
dict(folder="desert-oasis", title="Desert Oasis", emoji="🏜️",
  icon='<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  blurb="Hot sand, cool oasis water, and animals that love the heat.",
  sub="Tap desert animals · then count the dates at the well",
  ground=0xE0C288, dark=0xB98F52, skyTop=0x6FA8D8, skyBot=0xF2E3B0,
  amb="wind", countName="Date Counting Game", countEmoji="🌴",
  countPrompt="Click the old well to find the sweet dates!",
  countDone="You found all 6 dates! Sweet counting, desert star!",
  item="dates", itemN=6,
  subjects=[
    dict(name="Camel", shape="quad", c1=0xD8A860, c2=0x8A5F30, extra="hump",
      fact="Camels store fat in their humps and can walk for days without a drink.",
      more="A camel's long eyelashes keep the desert sand out of its eyes.", freq=140),
    dict(name="Meerkat", shape="human", c1=0xC89858, c2=0x7A5A30, skin=0xD8A878, scale=0.8,
      fact="Meerkats stand up tall on their back legs to watch for danger.",
      more="A meerkat gang is called a mob, and they take turns standing guard.", freq=520),
    dict(name="Tortoise", shape="blob", c1=0x7A9F4F, c2=0x4A6A2F, extra="shell",
      fact="Desert tortoises nap in cool underground burrows on hot days.",
      more="A tortoise can live for more than one hundred years.", freq=180),
    dict(name="Jackal", shape="quad", c1=0xC8A06A, c2=0xE8D8B0, extra="pointy",
      fact="Jackals have big ears that help them hear tiny sounds far away.",
      more="Jackals are clever hunters that mostly come out at night.", freq=300),
    dict(name="Scorpion", shape="bug", c1=0xD8A83A, c2=0x6A4A10, scale=0.8,
      fact="Scorpions glow a spooky blue-green under ultraviolet light.",
      more="Baby scorpions ride on their mother's back until they grow up.", freq=240),
    dict(name="Date Palm", shape="plant", c1=0x3F8F3F, c2=0x7A5230, scale=1.2,
      fact="Date palms grow sweet fruit and give cool shade at the oasis.",
      more="One date palm tree can grow more than a hundred dates a year.", freq=440),
  ],
  tips=["Deserts are very dry places with little rain.",
    "An oasis is a green wet spot in the middle of a desert.",
    "Many desert animals come out at night when it is cool.",
    "Camels can close their noses to keep sand out."],
  quiz=[dict(q="Where do camels store fat?", opts=["In their humps", "In their tails", "In their ears"], ans=0),
    dict(q="Where do desert tortoises nap?", opts=["In burrows", "In trees", "In rivers"], ans=0),
    dict(q="What color do scorpions glow?", opts=["Blue-green", "Red", "Purple"], ans=0),
    dict(q="What grows on a date palm?", opts=["Sweet dates", "Apples", "Carrots"], ans=0),
    dict(q="When do most desert animals come out?", opts=["At night", "At noon", "Never"], ans=0)]),
dict(folder="pirate-cove", title="Pirate Cove", emoji="🏴‍☠️",
  icon='<path d="M4 20 12 4l8 16Z"/><path d="M12 4v16M7.5 13h9"/>',
  blurb="Sail in, meet the crew, and hunt for hidden gold coins.",
  sub="Tap the pirate crew · then count the gold coins on the ship",
  ground=0xD8C890, dark=0xA88F52, skyTop=0x5F9FD8, skyBot=0xD8ECF5,
  amb="waves", countName="Coin Counting Game", countEmoji="🪙",
  countPrompt="Click the pirate ship to find the hidden gold coins!",
  countDone="You found all 7 coins! You are a true treasure hunter!",
  item="coins", itemN=7,
  subjects=[
    dict(name="Captain", shape="human", c1=0x3A4A6A, c2=0xD84040, skin=0xF2C89B, extra="pirate",
      fact="The captain wears a big hat and reads the treasure map.",
      more="Pirate captains were chosen by their own crew.", freq=160),
    dict(name="Parrot", shape="bird", c1=0x3F9F4F, c2=0xE04040, scale=0.8,
      fact="Parrots can copy words they hear again and again.",
      more="A parrot's strong beak can crack open hard nuts.", freq=620),
    dict(name="Crab", shape="bug", c1=0xE05040, c2=0x8A2010, scale=0.85,
      fact="Crabs walk sideways and snap with their strong claws.",
      more="A crab grows a brand-new shell after shedding the old one.", freq=280),
    dict(name="Seagull", shape="bird", c1=0xF0F2F5, c2=0xE8A83A, scale=0.9,
      fact="Seagulls cry loudly to call their friends to food.",
      more="Seagulls can drink salty sea water with a special gland.", freq=560),
    dict(name="Sea Turtle", shape="blob", c1=0x4A9F6A, c2=0x2A5A3A, extra="shell",
      fact="Sea turtles swim thousands of miles across the ocean.",
      more="Baby turtles hatch on warm sandy beaches at night.", freq=200),
    dict(name="Treasure Chest", shape="prop", ptype="chest", c1=0x7A5230, c2=0xFFD166,
      fact="Pirates kept gold coins and jewels in heavy wooden chests.",
      more="Real treasure chests were locked with big iron keys.", freq=380),
  ],
  tips=["Pirates sailed the seas hundreds of years ago.",
    "A compass needle always points north.",
    "Seagulls follow ships hoping for fish scraps.",
    "Maps marked treasure with a big red X."],
  quiz=[dict(q="What can a parrot do?", opts=["Copy words", "Swim deep", "Dig holes"], ans=0),
    dict(q="How do crabs walk?", opts=["Sideways", "Backwards", "In circles"], ans=0),
    dict(q="What did pirates keep in chests?", opts=["Gold", "Shoes", "Soup"], ans=0),
    dict(q="Where do baby turtles hatch?", opts=["Sandy beaches", "Snowy hills", "Tall trees"], ans=0),
    dict(q="What points north?", opts=["A compass", "A coin", "A crab"], ans=0)]),
dict(folder="moon-base", title="Moon Base", emoji="🌙",
  icon='<path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z"/><circle cx="17" cy="6" r="1"/>',
  blurb="Bounce on the Moon, meet aliens, and count the star flags.",
  sub="Tap the Moon crew · then count the star flags at the dome",
  ground=0x9AA0A8, dark=0x6A6F78, skyTop=0x0A1028, skyBot=0x2A3A5A,
  amb="space", countName="Star Flag Counting Game", countEmoji="🚩",
  countPrompt="Click the Moon dome to find the hidden star flags!",
  countDone="You found all 5 flags! One giant leap for counting!",
  item="flags", itemN=5, night=True,
  subjects=[
    dict(name="Astronaut", shape="human", c1=0xE8ECF2, c2=0x3A5AD0, skin=0xF2C89B, extra="helmet",
      fact="Astronauts wear suits that carry air, water, and warmth.",
      more="Astronauts bounce in slow motion because the Moon pulls weakly.", freq=220),
    dict(name="Moon Rover", shape="prop", ptype="vehicle", c1=0xC8CCD4, c2=0x3A3F48,
      fact="The Moon rover drove astronauts across the gray dusty ground.",
      more="The rover's wheels were made of springy wire mesh.", freq=180),
    dict(name="Alien", shape="blob", c1=0x5FD86A, c2=0x2A7A3A, extra="antennae",
      fact="Storybook aliens have big eyes to see in the dark of space.",
      more="No aliens have been found yet, but scientists keep looking.", freq=480),
    dict(name="Helper Robot", shape="human", c1=0x9AA2B0, c2=0xFFD166, skin=0x8A93A0, extra="antennae",
      fact="Robots help astronauts by carrying tools and taking photos.",
      more="Some robots on Mars drive all by themselves.", freq=260),
    dict(name="Satellite", shape="prop", ptype="satellite", c1=0xC8CCD4, c2=0x3A6FD0, scale=1.1,
      fact="Satellites beam phone calls, maps, and TV down to Earth.",
      more="Thousands of satellites circle the Earth right now.", freq=340),
    dict(name="Moon Rock", shape="blob", c1=0x8A8F98, c2=0x5A5F68, scale=0.8,
      fact="Moon rocks are full of tiny holes made by space crashes.",
      more="Astronauts brought 382 kilograms of Moon rocks home.", freq=150),
  ],
  tips=["The Moon is Earth's only natural satellite.",
    "Footprints on the Moon can last millions of years.",
    "One Moon day lasts about two Earth weeks.",
    "The Moon pulls the ocean into tides."],
  quiz=[dict(q="What do astronaut suits carry?", opts=["Air and water", "Pizza", "Balloons"], ans=0),
    dict(q="Why do astronauts bounce?", opts=["Weak Moon pull", "Strong wind", "Springs"], ans=0),
    dict(q="What do satellites beam down?", opts=["Calls and maps", "Rain", "Snow"], ans=0),
    dict(q="How long is one Moon day?", opts=["Two weeks", "One hour", "One year"], ans=0),
    dict(q="What pulls ocean tides?", opts=["The Moon", "Fish", "Boats"], ans=0)]),
dict(folder="rainbow-lab", title="Rainbow Lab", emoji="🌈",
  icon='<path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3"/>',
  blurb="Mix fizzy potions and count the bubbles in the big flask.",
  sub="Tap the lab helpers · then count the bubbles in the flask",
  ground=0xC8D8E8, dark=0x8AA0B8, skyTop=0x6F7FD8, skyBot=0xE8D8F5,
  amb="soft", countName="Bubble Counting Game", countEmoji="🫧",
  countPrompt="Click the giant flask to find the hidden bubbles!",
  countDone="You found all 6 bubbles! Fizz-tastic counting!",
  item="bubbles", itemN=6,
  subjects=[
    dict(name="Scientist", shape="human", c1=0xF0F2F5, c2=0x3A6FD0, skin=0xF2C89B, extra="goggles",
      fact="Scientists ask questions and test ideas with fun experiments.",
      more="Scientists write down every result, even surprises.", freq=300),
    dict(name="Flask", shape="prop", ptype="flask", c1=0x9FD8F0, c2=0xC86AD0, scale=0.9,
      fact="Flasks hold colorful liquids that fizz and bubble in tests.",
      more="Always wear goggles near real lab glass.", freq=420),
    dict(name="Magnet", shape="prop", ptype="magnet", c1=0xE04040, c2=0xF0F2F5, scale=0.9,
      fact="Magnets pull iron and steel without even touching them.",
      more="Every magnet has a north end and a south end.", freq=240),
    dict(name="Robot Arm", shape="prop", ptype="arm", c1=0xFFB347, c2=0x3A3F48, scale=1.0,
      fact="Robot arms lift and pour things too tricky for hands.",
      more="Car factories use hundreds of robot arms.", freq=200),
    dict(name="Crystal", shape="prop", ptype="crystal", c1=0x9A6AE0, c2=0x5A3AC0, scale=0.9,
      fact="Crystals grow in neat shapes when liquids cool slowly.",
      more="Snowflakes are tiny crystals that fall from clouds.", freq=520),
    dict(name="Test Tube", shape="prop", ptype="tube", c1=0x9FD8F0, c2=0x5FD86A, scale=0.9,
      fact="Test tubes hold tiny sips of liquid for safe mixing.",
      more="Scientists tap tubes gently to stir, never shake hard.", freq=460),
  ],
  tips=["Science means asking questions and testing ideas.",
    "Magnets pull iron but not wood or plastic.",
    "Bubbles are thin skins of soapy water filled with air.",
    "Rainbows appear when sun meets rain."],
  quiz=[dict(q="What do scientists test?", opts=["Ideas", "Pillows", "Shoes"], ans=0),
    dict(q="What do magnets pull?", opts=["Iron", "Wood", "Plastic"], ans=0),
    dict(q="What is a bubble made of?", opts=["Soapy water", "Rocks", "Wool"], ans=0),
    dict(q="When do rainbows appear?", opts=["Sun plus rain", "Night only", "Snow only"], ans=0),
    dict(q="What has north and south ends?", opts=["A magnet", "A flask", "A tube"], ans=0)]),
dict(folder="castle-quest", title="Castle Quest", emoji="🏰",
  icon='<path d="M4 21V9l3-1V5h2v2h2V5h2v2h2V5h2v3l3 1v12Z"/><path d="M10 21v-4h4v4"/>',
  blurb="Knights, dragons, and a tall stone keep to explore.",
  sub="Tap the castle friends · then count the shields at the keep",
  ground=0x5DA34A, dark=0x3E7A34, skyTop=0x6F9FD8, skyBot=0xD8E8F5,
  amb="forest", countName="Shield Counting Game", countEmoji="🛡️",
  countPrompt="Click the tall keep to find the hidden shields!",
  countDone="You found all 5 shields! Brave knight of counting!",
  item="shields", itemN=5,
  subjects=[
    dict(name="Knight", shape="human", c1=0x8A93A0, c2=0xD84040, skin=0xF2C89B, extra="helmet",
      fact="Knights wore shiny armor made of linked iron rings and plates.",
      more="A knight's helper was called a squire.", freq=170),
    dict(name="Horse", shape="quad", c1=0x8A5A3A, c2=0x3A2418, extra="mane",
      fact="Knights rode strong horses called steeds into parades.",
      more="Horses can sleep standing up.", freq=200),
    dict(name="Dragon", shape="quad", c1=0x3F9F4F, c2=0xFFD166, extra="wings",
      fact="Story dragons guard treasure and breathe pretend fire.",
      more="Dragon stories are told in almost every country.", freq=130),
    dict(name="Catapult", shape="prop", ptype="catapult", c1=0x7A5230, c2=0x3A3F48, scale=1.0,
      fact="Catapults flung stones high over castle walls long ago.",
      more="A catapult arm works like a giant spoon.", freq=150),
    dict(name="Banner", shape="prop", ptype="banner", c1=0xD84040, c2=0xFFD166, scale=1.0,
      fact="Banners showed a knight's colors so friends knew him far away.",
      more="Each picture on a flag is called a charge.", freq=400),
    dict(name="Torch", shape="prop", ptype="torch", c1=0x7A5230, c2=0xFF9F3A, scale=0.9,
      fact="Torches lit dark castle halls with warm flickering flames.",
      more="Castle torches burned oil-soaked cloth.", freq=360),
  ],
  tips=["Castles were strong homes for kings and queens.",
    "A moat is a water ditch that guards a castle.",
    "Knights followed a code called chivalry.",
    "Drawbridges could lift up to block enemies."],
  quiz=[dict(q="What did knights wear?", opts=["Armor", "Pyjamas", "Sandals"], ans=0),
    dict(q="What guards castle treasure in stories?", opts=["Dragons", "Ducks", "Mice"], ans=0),
    dict(q="What did catapults fling?", opts=["Stones", "Pillows", "Apples"], ans=0),
    dict(q="What is a moat?", opts=["A water ditch", "A hat", "A horse"], ans=0),
    dict(q="What showed a knight's colors?", opts=["A banner", "A shoe", "A spoon"], ans=0)]),
dict(folder="frog-pond", title="Frog Pond", emoji="🐸",
  icon='<path d="M12 21c-5 0-8-3-8-7 0-3 2-5 4-5.5C9 7 10 6 12 6s3 1 4 2.5c2 .5 4 2.5 4 5.5 0 4-3 7-8 7Z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>',
  blurb="Croak with frogs and count the tadpoles in the pond.",
  sub="Tap the pond friends · then count the tadpoles in the water",
  ground=0x63B04A, dark=0x3E8B3A, skyTop=0x6F9FD8, skyBot=0xD8F0D8,
  amb="forest", countName="Tadpole Counting Game", countEmoji="🐟",
  countPrompt="Click the big pond to find the hidden tadpoles!",
  countDone="You found all 6 tadpoles! Hoppy counting, frog friend!",
  item="tadpoles", itemN=6,
  subjects=[
    dict(name="Frog", shape="blob", c1=0x4AAF4A, c2=0xFFD166, extra="bugeyes",
      fact="Frogs lay eggs in water that hatch into wiggly tadpoles.",
      more="A frog hears with flat circles behind its eyes.", freq=320),
    dict(name="Duck", shape="bird", c1=0xF5E9B0, c2=0xE8A83A, scale=0.9,
      fact="Ducks have oily feathers so water rolls right off.",
      more="Baby ducks are called ducklings.", freq=420),
    dict(name="Pond Turtle", shape="blob", c1=0x5A8F4F, c2=0x3A5A2F, extra="shell",
      fact="Turtles sunbathe on logs to warm their cold bodies.",
      more="A turtle's shell is part of its bones.", freq=190),
    dict(name="Heron", shape="bird", c1=0x9AA8B8, c2=0x3A3F48, scale=1.15, extra="longlegs",
      fact="Herons stand super still, then strike fast to catch fish.",
      more="A heron can fly with its long legs stretched behind.", freq=260),
    dict(name="Fish", shape="fish", c1=0x5EC4E8, c2=0xFF9F5A, scale=0.9,
      fact="Fish breathe underwater with fluffy parts called gills.",
      more="Some fish sleep with their eyes open.", freq=480),
    dict(name="Lotus", shape="plant", c1=0xFF9FB0, c2=0x3F8F3F, scale=1.0,
      fact="Lotus flowers open in the morning and close at night.",
      more="Lotus leaves are so waxy that mud slides off.", freq=540),
  ],
  tips=["Ponds are small homes full of plants and animals.",
    "Tadpoles grow legs and become frogs.",
    "Ducks paddle with wide webbed feet.",
    "Lily pads are leaves that float on water."],
  quiz=[dict(q="What do frog eggs hatch into?", opts=["Tadpoles", "Birds", "Worms"], ans=0),
    dict(q="Why does water roll off ducks?", opts=["Oily feathers", "Magic", "Wind"], ans=0),
    dict(q="How do fish breathe?", opts=["With gills", "With lungs", "With noses"], ans=0),
    dict(q="What do lotus flowers do at night?", opts=["Close up", "Sing", "Swim"], ans=0),
    dict(q="How do herons catch fish?", opts=["Strike fast", "Dig holes", "Climb trees"], ans=0)]),
dict(folder="lighthouse-bay", title="Lighthouse Bay", emoji="🗼",
  icon='<path d="M9 21 11 8h2l2 13M10 8V5h4v3M8 5h8M7 21h10"/><circle cx="12" cy="11" r="1.4"/>',
  blurb="Flash the lighthouse beam and count the bobbing buoys.",
  sub="Tap the bay friends · then count the buoys by the lighthouse",
  ground=0x9AA8B0, dark=0x5A7A8A, skyTop=0x5F8FD8, skyBot=0xF5E3B0,
  amb="waves", countName="Buoy Counting Game", countEmoji="🔴",
  countPrompt="Click the lighthouse to find the hidden buoys!",
  countDone="You found all 5 buoys! Shining bright, sailor!",
  item="buoys", itemN=5,
  subjects=[
    dict(name="Sailor", shape="human", c1=0x2B4A6A, c2=0xF0F2F5, skin=0xF2C89B, extra="sailor",
      fact="Sailors read maps of the sea called charts to find their way.",
      more="Sailors say port for left and starboard for right.", freq=230),
    dict(name="Sailboat", shape="prop", ptype="boat", c1=0xF0F2F5, c2=0xD84040, scale=1.1,
      fact="Sailboats catch the wind in big cloth sails to glide along.",
      more="The front of a boat is called the bow.", freq=280),
    dict(name="Seagull", shape="bird", c1=0xF0F2F5, c2=0x3A3F48, scale=0.9,
      fact="Seagulls ride warm air going up without flapping.",
      more="A group of seagulls is called a flock.", freq=580),
    dict(name="Crab", shape="bug", c1=0xE06040, c2=0x8A2010, scale=0.85,
      fact="Crabs hide under rocks when big waves come in.",
      more="Crabs taste with tiny hairs on their claws.", freq=300),
    dict(name="Fish", shape="fish", c1=0xFFB347, c2=0x3A6FD0, scale=0.9,
      fact="Bay fish swim in glittery groups called schools.",
      more="Fish talk by wiggling and making tiny clicks.", freq=500),
    dict(name="Buoy", shape="prop", ptype="buoy", c1=0xE04040, c2=0xF0F2F5, scale=1.0,
      fact="Buoys float and bob to mark safe paths for boats.",
      more="Some buoys ring bells when waves rock them.", freq=350),
  ],
  tips=["Lighthouses warn ships away from rocks.",
    "A lighthouse beam can reach far across the sea.",
    "Tides make the sea rise and fall each day.",
    "Harbor seals nap on warm sunny rocks."],
  quiz=[dict(q="What do lighthouses warn about?", opts=["Rocks", "Clouds", "Birds"], ans=0),
    dict(q="What catches wind on a sailboat?", opts=["Sails", "Anchors", "Ropes"], ans=0),
    dict(q="What do buoys mark?", opts=["Safe paths", "Fish names", "Clouds"], ans=0),
    dict(q="What is a group of fish called?", opts=["A school", "A class", "A team"], ans=0),
    dict(q="What makes the sea rise and fall?", opts=["Tides", "Fish", "Boats"], ans=0)]),
dict(folder="ant-city", title="Ant City", emoji="🐜",
  icon='<circle cx="7" cy="14" r="3"/><circle cx="13" cy="12" r="2.4"/><circle cx="18" cy="10" r="2"/><path d="M16 8l1-3M18.5 8l2-2"/>',
  blurb="March with the colony and count the crumbs in the hill.",
  sub="Tap the tiny neighbors · then count the crumbs in the hill",
  ground=0xB08A5A, dark=0x7A5A34, skyTop=0x6FA8D8, skyBot=0xE8D8B0,
  amb="forest", countName="Crumb Counting Game", countEmoji="🍪",
  countPrompt="Click the giant anthill to find the hidden crumbs!",
  countDone="You found all 7 crumbs! Mighty ant of counting!",
  item="crumbs", itemN=7,
  subjects=[
    dict(name="Queen Ant", shape="bug", c1=0x6A3A20, c2=0x2A1808, scale=1.25,
      fact="The queen ant lays all the eggs for the whole colony.",
      more="A queen ant can live for many years.", freq=160),
    dict(name="Worker Ant", shape="bug", c1=0x4A3020, c2=0x201008, scale=0.9,
      fact="Worker ants can lift things much heavier than themselves.",
      more="Ants talk by touching feelers called antennae.", freq=380),
    dict(name="Aphid", shape="blob", c1=0x8FD86A, c2=0x4A8A3A, scale=0.6,
      fact="Ants keep aphids like cows and sip their sweet juice.",
      more="Aphids drink sap from soft plant stems.", freq=540),
    dict(name="Ladybug", shape="bug", c1=0xE83A3A, c2=0x111111, scale=0.85, extra="spots",
      fact="Ladybugs munch the aphids that bother garden plants.",
      more="A ladybug's spots warn birds that it tastes bad.", freq=460),
    dict(name="Leaf", shape="plant", c1=0x4A9F3F, c2=0x2A6A2A, scale=1.0, extra="flatleaf",
      fact="Leaf-cutter ants carry leaf pieces bigger than their bodies.",
      more="Ants chew leaves into mush to grow food.", freq=500),
    dict(name="Tunnel", shape="prop", ptype="arch", c1=0x8A5F36, c2=0x5A3A1E, scale=1.1,
      fact="Ant tunnels link many rooms deep under the ground.",
      more="Some ant nests go deeper than a grown-up is tall.", freq=220),
  ],
  tips=["Ants live in big families called colonies.",
    "Ants leave smell trails for friends to follow.",
    "An ant has six legs and two feelers.",
    "Some ants farm tiny bugs called aphids."],
  quiz=[dict(q="Who lays eggs for the colony?", opts=["The queen", "The leaf", "The tunnel"], ans=0),
    dict(q="How many legs does an ant have?", opts=["Six", "Eight", "Four"], ans=0),
    dict(q="What do ants follow?", opts=["Smell trails", "Rainbows", "Stars"], ans=0),
    dict(q="What do ladybugs munch?", opts=["Aphids", "Rocks", "Clouds"], ans=0),
    dict(q="What do leaf-cutters carry?", opts=["Leaf pieces", "Bricks", "Balloons"], ans=0)]),
dict(folder="balloon-sky", title="Balloon Sky", emoji="🎈",
  icon='<ellipse cx="12" cy="9" rx="6" ry="7"/><path d="M12 16v3M9 21h6M10 19l-1 2M14 19l1 2"/>',
  blurb="Float past clouds and count the little balloons aloft.",
  sub="Tap the sky friends · then count the balloons by the big balloon",
  ground=0x8FC86A, dark=0x5A9A48, skyTop=0x4A8FD8, skyBot=0xD8F0FF,
  amb="breeze", countName="Balloon Counting Game", countEmoji="🎈",
  countPrompt="Click the giant balloon to find the little balloons!",
  countDone="You found all 6 balloons! Up, up, and count away!",
  item="minis", itemN=6,
  subjects=[
    dict(name="Pilot", shape="human", c1=0x6A4AD0, c2=0xFFD166, skin=0xF2C89B, extra="cap",
      fact="Balloon pilots heat the air inside to float gently upward.",
      more="Balloon baskets are woven from bendy wicker.", freq=260),
    dict(name="Cloud", shape="blob", c1=0xFFFFFF, c2=0xD8E4F0, scale=1.1, extra="puffy",
      fact="Clouds are crowds of tiny water drops floating in the sky.",
      more="Fluffy low clouds are called cumulus.", freq=440),
    dict(name="Swallow", shape="bird", c1=0x3A5AC0, c2=0xE04040, scale=0.85,
      fact="Swallows swoop and zip to catch flies in mid-air.",
      more="Swallows fly thousands of miles to warm lands.", freq=600),
    dict(name="Kite", shape="prop", ptype="kite", c1=0xFF5A7A, c2=0xFFD166, scale=1.0,
      fact="Kites climb when wind pushes their tilted faces upward.",
      more="The longest kite flights last for days.", freq=480),
    dict(name="Airplane", shape="prop", ptype="plane", c1=0xE8ECF2, c2=0x3A6FD0, scale=1.0,
      fact="Airplane wings lift the plane as air rushes past them.",
      more="Jets fly higher than the tallest mountains.", freq=240),
    dict(name="Sunny", shape="face", mood="happy", c1=0xFFD94A, c2=0xE8A83A, scale=1.0,
      fact="The Sun is a star that warms our whole wide world.",
      more="Sunlight takes eight minutes to reach us.", freq=520),
  ],
  tips=["Hot air rises, and that lifts balloons.",
    "Clouds are made of tiny water drops.",
    "Wind is air moving from place to place.",
    "Birds have hollow bones to fly light."],
  quiz=[dict(q="What lifts a hot-air balloon?", opts=["Hot air", "Heavy rocks", "Water"], ans=0),
    dict(q="What are clouds made of?", opts=["Water drops", "Cotton", "Sand"], ans=0),
    dict(q="What is wind?", opts=["Moving air", "Falling rain", "Bird songs"], ans=0),
    dict(q="What is the Sun?", opts=["A star", "A planet", "A cloud"], ans=0),
    dict(q="Why are bird bones hollow?", opts=["To fly light", "To sing", "To swim"], ans=0)]),
dict(folder="feelings-stage", title="Feelings Stage", emoji="🎭",
  icon='<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M8.5 15c2 1.6 5 1.6 7 0"/>',
  blurb="Meet the feelings on stage and count the hearts.",
  sub="Tap each feeling · then count the hearts on the stage",
  ground=0x9A7FD0, dark=0x6A55A0, skyTop=0x5A5AD0, skyBot=0xF5D8E8,
  amb="crowd", countName="Heart Counting Game", countEmoji="💛",
  countPrompt="Click the stage curtains to find the hidden hearts!",
  countDone="You found all 5 hearts! Your feelings did great!",
  item="hearts", itemN=5,
  subjects=[
    dict(name="Happy", shape="face", mood="happy", c1=0xFFD94A, c2=0xE8A83A,
      fact="Happy feels light and smiley, like sunshine in your chest.",
      more="Smiling can make happy feelings grow bigger.", freq=520),
    dict(name="Sad", shape="face", mood="sad", c1=0x6FA8D8, c2=0x3A5A8A,
      fact="Sad feels heavy, and crying can help the hurt flow out.",
      more="Hugs from someone kind help sadness shrink.", freq=220),
    dict(name="Angry", shape="face", mood="angry", c1=0xE05A4A, c2=0x7A2010,
      fact="Angry feels hot and tight. Slow breaths can cool it down.",
      more="Counting to ten gives anger time to rest.", freq=180),
    dict(name="Scared", shape="face", mood="scared", c1=0x9A7AC0, c2=0x4A3570, scale=0.95,
      fact="Scared keeps you safe by telling you to be careful.",
      more="Holding a grown-up's hand makes scary things smaller.", freq=300),
    dict(name="Surprised", shape="face", mood="ooh", c1=0x5ED9C0, c2=0x2A7A68, scale=0.95,
      fact="Surprised pops up fast when something unexpected happens.",
      more="Surprises can turn into happy or scared feelings.", freq=420),
    dict(name="Calm", shape="face", mood="calm", c1=0x8FD86A, c2=0x3A7A3A,
      fact="Calm feels soft and quiet, like resting on green grass.",
      more="Slow breathing is the fastest road to calm.", freq=360),
  ],
  tips=["All feelings are okay to feel.",
    "Naming a feeling makes it easier to handle.",
    "Slow breaths help big feelings get smaller.",
    "Talking to someone kind helps sad times."],
  quiz=[dict(q="What helps anger cool down?", opts=["Slow breaths", "Shouting", "Hiding"], ans=0),
    dict(q="What does scared tell you?", opts=["Be careful", "Run fast", "Laugh"], ans=0),
    dict(q="What can smiling do?", opts=["Grow happy", "Stop rain", "Fly"], ans=0),
    dict(q="What helps sadness shrink?", opts=["Kind hugs", "Loud drums", "Dark rooms"], ans=0),
    dict(q="Where does calm rest?", opts=["Soft quiet", "Noisy crowds", "Fast cars"], ans=0)]),
]

# ------------------------------------------------- centerpieces + scatter
# Helpers available in page JS: M(parent,geo,color,x,y,z,sx,sy,sz,opts),
# GEO.{sph,box,cyl,cone,tor,oct}, mat(). center group at (0,0,-14).
# hr/hy = hidden counting-item ring radius/height around center origin.
CENTERS = {
"desert-oasis": dict(hr=1.0, hy=1.3, code="""
M(center,GEO.cyl,0xC89B6A, 0,0.6,0, 1.6,1.2,1.6);
M(center,GEO.cyl,0x8A5A3A, 0,1.3,0, 1.85,0.25,1.85);
M(center,GEO.box,0x7A5230, -1.3,2.0,0, .25,2.0,.25);
M(center,GEO.box,0x7A5230, 1.3,2.0,0, .25,2.0,.25);
M(center,GEO.cone,0x8A5A3A, 0,3.6,0, 2.1,1.3,2.1);
M(center,GEO.cyl,0x5A3A22, 0,2.7,0, .08,.08,2.8,{rz:Math.PI/2});
M(center,GEO.box,0xA86A3A, 0,1.9,0, .5,.5,.5);
M(center,GEO.cyl,0x7A5230, 2.6,0.3,1.2, .9,.6,.9);
"""),
"pirate-cove": dict(hr=3.0, hy=1.2, code="""
M(center,GEO.box,0x6A452A, 0,1.0,0, 2.2,1.2,4.4);
M(center,GEO.box,0x8A5F36, 0,1.7,0, 2.4,0.25,4.6);
M(center,GEO.cyl,0x5A3A22, 0,3.6,-0.4, .12,.12,4.4);
M(center,GEO.box,0xF0F2F5, 0,3.7,0.6, 2.0,1.6,.12);
M(center,GEO.box,0xD84040, 0,5.6,-0.4, .9,.6,.1);
M(center,GEO.sph,0x2B2B33, -1.15,1.0,-1, .22,.22,.22);
M(center,GEO.sph,0x2B2B33, -1.15,1.0,0.2, .22,.22,.22);
M(center,GEO.sph,0x2B2B33, -1.15,1.0,1.4, .22,.22,.22);
M(center,GEO.sph,0x2B2B33, 1.15,1.0,-1, .22,.22,.22);
M(center,GEO.sph,0x2B2B33, 1.15,1.0,0.2, .22,.22,.22);
M(center,GEO.sph,0x2B2B33, 1.15,1.0,1.4, .22,.22,.22);
"""),
"moon-base": dict(hr=2.8, hy=1.0, code="""
M(center,GEO.sph,0xD8DCE2, 0,0.2,0, 2.4,1.9,2.4);
M(center,GEO.box,0x2B3A44, 0,0.9,2.0, 1.0,1.6,.3);
M(center,GEO.box,0x5FE8F0, -1.2,1.4,1.85, .6,.5,.15,{emissive:0x5FE8F0,ei:.7});
M(center,GEO.box,0x5FE8F0, 1.2,1.4,1.85, .6,.5,.15,{emissive:0x5FE8F0,ei:.7});
M(center,GEO.cyl,0x9AA2B0, 1.8,2.6,-1, .08,.08,2.2);
M(center,GEO.cone,0xC8CCD4, 1.8,3.9,-1, .5,.5,.5);
M(center,GEO.sph,0xFF5A5A, 1.8,4.25,-1, .14,.14,.14,{emissive:0xFF5A5A,ei:1});
M(center,GEO.box,0xFFD166, 0,0.15,2.6, 1.6,.3,.8);
"""),
"rainbow-lab": dict(hr=1.8, hy=2.0, code="""
M(center,GEO.box,0x8A5A9A, 0,1.0,0, 3.0,.25,1.6);
M(center,GEO.box,0x6A4A7A, -1.3,0.5,0, .2,1.0,.2);
M(center,GEO.box,0x6A4A7A, 1.3,0.5,0, .2,1.0,.2);
M(center,GEO.sph,0x9FD8F0, 0,2.2,0, 1.05,1.05,1.05,{opacity:.92});
M(center,GEO.sph,0xB04AD0, 0,1.85,0, .8,.6,.8,{emissive:0xB04AD0,ei:.35});
M(center,GEO.cyl,0x9FD8F0, 0,3.3,0, .3,.3,.9);
M(center,GEO.cyl,0xFFD166, -1.0,1.35,0, .28,.28,.5);
M(center,GEO.cyl,0x5FD86A, 1.0,1.35,0, .28,.28,.5);
"""),
"castle-quest": dict(hr=3.0, hy=1.2, code="""
M(center,GEO.box,0x9A9AA2, 0,1.7,0, 3.0,3.4,3.0);
M(center,GEO.cyl,0x8A8A92, -1.7,2.2,-1.7, .7,.7,4.4);
M(center,GEO.cyl,0x8A8A92, 1.7,2.2,-1.7, .7,.7,4.4);
M(center,GEO.cyl,0x8A8A92, -1.7,2.2,1.7, .7,.7,4.4);
M(center,GEO.cyl,0x8A8A92, 1.7,2.2,1.7, .7,.7,4.4);
M(center,GEO.cone,0x3A5A9A, -1.7,5.0,-1.7, .95,1.2,.95);
M(center,GEO.cone,0x3A5A9A, 1.7,5.0,-1.7, .95,1.2,.95);
M(center,GEO.cone,0x3A5A9A, -1.7,5.0,1.7, .95,1.2,.95);
M(center,GEO.cone,0x3A5A9A, 1.7,5.0,1.7, .95,1.2,.95);
M(center,GEO.box,0x5A3A22, 0,1.0,1.55, 1.2,2.0,.2);
M(center,GEO.box,0x2B2B33, -0.9,2.5,1.5, .5,.7,.1);
M(center,GEO.box,0x2B2B33, 0.9,2.5,1.5, .5,.7,.1);
M(center,GEO.cyl,0x5A3A22, 0,4.4,-0.5, .06,.06,1.8);
M(center,GEO.box,0xD84040, 0,5.1,-0.5, 1.0,.6,.08);
"""),
"frog-pond": dict(hr=2.2, hy=0.6, code="""
M(center,GEO.cyl,0x3E7FA8, 0,0.08,0, 2.8,0.16,2.8,{rough:.25,metal:.15});
M(center,GEO.sph,0x4A9F3F, -1.2,0.2,0.8, .9,.18,.9);
M(center,GEO.sph,0xFF9FB0, -1.2,0.45,0.8, .35,.25,.35);
M(center,GEO.sph,0xFFD166, -1.2,0.55,0.8, .14,.14,.14);
M(center,GEO.cyl,0x2F7F2F, 2.0,0.8,-1.0, .06,.06,1.8);
M(center,GEO.cyl,0x2F7F2F, 2.4,0.7,-0.4, .06,.06,1.5);
M(center,GEO.sph,0x6A4A2A, 2.0,1.75,-1.0, .14,.2,.14);
M(center,GEO.sph,0x6A4A2A, 2.4,1.5,-0.4, .14,.2,.14);
M(center,GEO.sph,0x8A8F98, -2.2,0.25,-1.2, .5,.35,.5);
"""),
"lighthouse-bay": dict(hr=2.8, hy=1.0, code="""
M(center,GEO.cyl,0x7A7F88, 0,0.3,0, 1.9,0.6,1.9);
M(center,GEO.cyl,0xD84040, 0,1.4,0, 1.15,1.15,1.15);
M(center,GEO.cyl,0xF5F0E0, 0,2.4,0, 1.1,1.1,1.1);
M(center,GEO.cyl,0xD84040, 0,3.4,0, 1.05,1.05,1.05);
M(center,GEO.cyl,0xFFF2B0, 0,4.3,0, .8,.8,.8,{emissive:0xFFE08A,ei:.9});
M(center,GEO.cone,0x8A2A2A, 0,5.1,0, 1.1,.9,1.1);
M(center,GEO.cone,0xFFE08A, 0,4.3,2.8, 1.1,3.2,1.1,{opacity:.22,rx:Math.PI/2,emissive:0xFFE08A,ei:.4});
"""),
"ant-city": dict(hr=2.0, hy=0.9, code="""
M(center,GEO.cone,0x9A6A3A, 0,1.0,0, 2.3,2.0,2.3);
M(center,GEO.cone,0x7A5230, 0.5,1.5,0.4, 1.2,1.2,1.2);
M(center,GEO.tor,0x3A2410, 0,0.55,2.05, .55,.55,.55,{rx:0});
M(center,GEO.tor,0x8A5F36, -2.6,0.35,0.8, .8,.8,.8,{rx:Math.PI/2});
M(center,GEO.tor,0x8A5F36, 2.6,0.35,-0.6, .7,.7,.7,{rx:Math.PI/2});
M(center,GEO.sph,0xB08A5A, -1.4,0.15,1.6, .3,.2,.3);
M(center,GEO.sph,0xB08A5A, 1.6,0.15,1.4, .25,.18,.25);
"""),
"balloon-sky": dict(hr=2.8, hy=3.0, code="""
M(center,GEO.sph,0xE85A6A, 0,4.6,0, 1.8,2.2,1.8);
M(center,GEO.sph,0xFFD166, 0,4.6,1.2, 1.1,1.9,1.1);
M(center,GEO.sph,0x5EC4E8, 0,4.6,-1.2, 1.1,1.9,1.1);
M(center,GEO.box,0x7A5230, 0,1.0,0, 1.2,.9,1.2);
M(center,GEO.cyl,0x8A7A5A, -0.8,2.6,-0.8, .04,.04,2.6);
M(center,GEO.cyl,0x8A7A5A, 0.8,2.6,-0.8, .04,.04,2.6);
M(center,GEO.cyl,0x8A7A5A, -0.8,2.6,0.8, .04,.04,2.6);
M(center,GEO.cyl,0x8A7A5A, 0.8,2.6,0.8, .04,.04,2.6);
M(center,GEO.box,0x5A3A22, 0,1.7,0, .4,.5,.4);
"""),
"feelings-stage": dict(hr=2.4, hy=1.6, code="""
M(center,GEO.box,0x8A5F3A, 0,0.25,0, 4.6,.5,3.2);
M(center,GEO.box,0x6A55A0, 0,1.9,-1.5, 4.6,2.8,.3);
M(center,GEO.box,0xC03050, -2.0,1.9,-1.1, .8,2.8,.4);
M(center,GEO.box,0xC03050, 2.0,1.9,-1.1, .8,2.8,.4);
M(center,GEO.tor,0xFFD166, 0,3.4,-1.3, 1.6,1.6,1.6,{emissive:0xFFD166,ei:.3});
M(center,GEO.cone,0xFFF2B0, -1.4,2.6,-0.2, .7,1.4,.7,{opacity:.25,emissive:0xFFF2B0,ei:.4});
M(center,GEO.cone,0xFFF2B0, 1.4,2.6,-0.2, .7,1.4,.7,{opacity:.25,emissive:0xFFF2B0,ei:.4});
M(center,GEO.sph,0xFF5A7A, 0,3.5,-1.2, .3,.3,.3,{emissive:0xFF5A7A,ei:.5});
"""),
}

SCATTERS = {
"desert-oasis": """
for(let i=0;i<5;i++){const a=i/5*Math.PI*2+0.4,x=Math.cos(a)*15,z=Math.sin(a)*15;
const c=new THREE.Group();const t=new THREE.Mesh(GEO.cyl,mat(0x3F8F3F));t.scale.set(.22,.22,1.5);t.position.y=.75;c.add(t);
const arm=new THREE.Mesh(GEO.cyl,mat(0x3F8F3F));arm.scale.set(.16,.16,.7);arm.position.set(.3,1.0,0);arm.rotation.z=.7;c.add(arm);
c.position.set(x,0,z);c.traverse(o=>{o.castShadow=true;});scene.add(c);}
for(let i=0;i<7;i++){const r=new THREE.Mesh(GEO.sph,mat(0xC8A878));const a=Math.random()*Math.PI*2,d=10+Math.random()*9;
r.position.set(Math.cos(a)*d,.15,Math.sin(a)*d);r.scale.set(.5+Math.random()*.5,.3,.4+Math.random()*.4);r.castShadow=true;scene.add(r);}
M(scene,GEO.cyl,0x3E7FA8, 8,0.06,6, 3.2,0.12,3.2,{rough:.25,metal:.15});
""",
"pirate-cove": """
M(scene,GEO.cyl,0x3E7FA8, 0,0.04,-20, 14,0.1,8,{rough:.25,metal:.15});
for(let i=0;i<4;i++){const x=-14+i*9+2,z=6+(i%2)*5;const tr=new THREE.Mesh(GEO.cyl,mat(0x7A5230));
tr.scale.set(.18,.18,2.6);tr.position.set(x,1.3,z);tr.castShadow=true;scene.add(tr);
for(let k=0;k<4;k++){const lf=new THREE.Mesh(GEO.sph,mat(0x3F8F3F));lf.position.set(x+(k-1.5)*.7,2.9+((k%2)*.3),z);
lf.scale.set(.9,.25,.4);lf.castShadow=true;scene.add(lf);}}
for(let i=0;i<6;i++){const r=new THREE.Mesh(GEO.sph,mat(0x9A9AA2));const a=Math.random()*Math.PI*2,d=11+Math.random()*8;
r.position.set(Math.cos(a)*d,.15,Math.sin(a)*d);r.scale.set(.5,.35,.5);r.castShadow=true;scene.add(r);}
""",
"moon-base": """
for(let i=0;i<9;i++){const r=new THREE.Mesh(GEO.sph,mat(0x7A7F88));const a=Math.random()*Math.PI*2,d=9+Math.random()*11;
r.position.set(Math.cos(a)*d,.12,Math.sin(a)*d);const s=.25+Math.random()*.55;r.scale.set(s,s*.6,s);r.castShadow=true;scene.add(r);}
for(let i=0;i<40;i++){const st=new THREE.Mesh(GEO.sph,new THREE.MeshStandardMaterial({color:0xFFFFFF,emissive:0xFFFFFF,emissiveIntensity:.9}));
const a=Math.random()*Math.PI*2,d=30+Math.random()*40;st.position.set(Math.cos(a)*d,14+Math.random()*22,Math.sin(a)*d);
const s=.12+Math.random()*.2;st.scale.set(s,s,s);scene.add(st);}
const earth=new THREE.Mesh(GEO.sph,new THREE.MeshStandardMaterial({color:0x3A7FD0,emissive:0x1A3F80,emissiveIntensity:.5}));
earth.position.set(-22,20,-45);earth.scale.set(3,3,3);scene.add(earth);
""",
"rainbow-lab": """
for(let cx of [0xFF5A7A,0xFFB347,0xFFD94A,0x5FD86A,0x5EC4E8]){const t=new THREE.Mesh(GEO.tor,mat(cx));
t.position.set(0,0.5,-21);const s=7+cx%5;t.scale.set(s,s*.7,s);t.castShadow=false;scene.add(t);}
for(let i=0;i<8;i++){const a=i/8*Math.PI*2,d=12+Math.random()*7;const st=new THREE.Mesh(GEO.cyl,mat(0x3F8F3F));
st.scale.set(.05,.05,.8);st.position.set(Math.cos(a)*d,.4,Math.sin(a)*d);scene.add(st);
const cols=[0xFF6F8F,0xFFD166,0xC88FFF,0xFFFFFF];const h=new THREE.Mesh(GEO.sph,mat(cols[i%4]));
h.position.set(Math.cos(a)*d,.9,Math.sin(a)*d);h.scale.set(.22,.22,.22);h.castShadow=true;scene.add(h);}
""",
"castle-quest": """
M(scene,GEO.cyl,0x3E7FA8, 0,0.04,-20, 13,0.1,7,{rough:.25,metal:.15});
for(let i=0;i<5;i++){const x=-16+i*8,z=8+(i%2)*4;const tr=new THREE.Mesh(GEO.cone,mat(0x2F7F3F));
tr.position.set(x,1.2,z);tr.scale.set(1.2,2.4,1.2);tr.castShadow=true;scene.add(tr);
const t2=new THREE.Mesh(GEO.cyl,mat(0x6A452A));t2.scale.set(.18,.18,.8);t2.position.set(x,.4,z);scene.add(t2);}
for(let i=0;i<5;i++){const r=new THREE.Mesh(GEO.sph,mat(0x9A9AA2));const a=Math.random()*Math.PI*2,d=12+Math.random()*7;
r.position.set(Math.cos(a)*d,.15,Math.sin(a)*d);r.scale.set(.5,.35,.5);r.castShadow=true;scene.add(r);}
""",
"frog-pond": """
for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.2,d=11+Math.random()*7;const x=Math.cos(a)*d,z=Math.sin(a)*d;
const st=new THREE.Mesh(GEO.cyl,mat(0x2F7F2F));st.scale.set(.06,.06,1.6);st.position.set(x,.8,z);st.castShadow=true;scene.add(st);
const tip=new THREE.Mesh(GEO.sph,mat(0x6A4A2A));tip.position.set(x,1.7,z);tip.scale.set(.14,.2,.14);scene.add(tip);}
for(let i=0;i<5;i++){const a=Math.random()*Math.PI*2,d=6+Math.random()*9;const l=new THREE.Mesh(GEO.sph,mat(0x4A9F3F));
l.position.set(Math.cos(a)*d,.12,Math.sin(a)*d);l.scale.set(.7,.12,.7);scene.add(l);}
M(scene,GEO.cyl,0x7A5230, -9,0.3,7, .25,.25,3.0,{rz:Math.PI/2});
""",
"lighthouse-bay": """
M(scene,GEO.cyl,0x3E7FA8, 0,0.03,-21, 15,0.08,9,{rough:.25,metal:.15});
for(let i=0;i<3;i++){const f=new THREE.Mesh(GEO.tor,new THREE.MeshStandardMaterial({color:0xFFFFFF,roughness:.6}));
f.position.set(-6+i*6,.12,-14-(i%2)*3);f.rotation.x=Math.PI/2;f.scale.set(1.2+i*.3,1.2+i*.3,.4);scene.add(f);}
for(let i=0;i<6;i++){const r=new THREE.Mesh(GEO.sph,mat(0x8A8F98));const a=Math.random()*Math.PI*2,d=10+Math.random()*9;
r.position.set(Math.cos(a)*d,.15,Math.sin(a)*d);r.scale.set(.5+Math.random()*.4,.35,.45);r.castShadow=true;scene.add(r);}
for(let i=0;i<3;i++){const x=-13+i*13;const tr=new THREE.Mesh(GEO.cone,mat(0x2F7F3F));
tr.position.set(x,1.0,9);tr.scale.set(1.0,2.0,1.0);tr.castShadow=true;scene.add(tr);}
""",
"ant-city": """
for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,d=6+Math.random()*13;const b=new THREE.Mesh(GEO.cone,mat(0x4A9F3F));
b.position.set(Math.cos(a)*d,.35,Math.sin(a)*d);const s=.5+Math.random()*.7;b.scale.set(.12*s,1.0*s,.12*s);scene.add(b);}
for(let i=0;i<8;i++){const r=new THREE.Mesh(GEO.sph,mat(0x8A7A5A));const a=Math.random()*Math.PI*2,d=8+Math.random()*10;
r.position.set(Math.cos(a)*d,.12,Math.sin(a)*d);const s=.2+Math.random()*.3;r.scale.set(s,s*.7,s);r.castShadow=true;scene.add(r);}
const bigLeaf=new THREE.Mesh(GEO.sph,mat(0x4A9F3F));bigLeaf.position.set(-8,.15,-6);bigLeaf.scale.set(1.6,.12,1.0);
bigLeaf.rotation.y=.6;bigLeaf.castShadow=true;scene.add(bigLeaf);
""",
"balloon-sky": """
for(let i=0;i<5;i++){const cl=new THREE.Group();const x=-18+i*9,z=-14+(i%3)*7,y=9+(i%2)*3;
for(let k=0;k<3;k++){const p=new THREE.Mesh(GEO.sph,mat(0xFFFFFF));p.position.set(x+k*1.2-1.2,y,z);
p.scale.set(1.3,1.0,1.0);cl.add(p);}
scene.add(cl);}
for(let i=0;i<6;i++){const a=i/6*Math.PI*2,d=13+Math.random()*6;const tr=new THREE.Mesh(GEO.cone,mat(0x2F7F3F));
tr.position.set(Math.cos(a)*d,1.0,Math.sin(a)*d);tr.scale.set(1.0,2.0,1.0);tr.castShadow=true;scene.add(tr);}
""",
"feelings-stage": """
for(let i=0;i<6;i++){const a=i/6*Math.PI*2,d=15;const x=Math.cos(a)*d,z=Math.sin(a)*d;
const pole=new THREE.Mesh(GEO.cyl,mat(0x8A7AB8));pole.scale.set(.08,.08,2.6);pole.position.set(x,1.3,z);scene.add(pole);
const cols=[0xFFD94A,0xFF8FB0,0x5EC4E8,0x8FD86A,0xC88FFF,0xFFB347];
const orb=new THREE.Mesh(GEO.sph,new THREE.MeshStandardMaterial({color:cols[i],emissive:cols[i],emissiveIntensity:.8}));
orb.position.set(x,2.8,z);orb.scale.set(.3,.3,.3);scene.add(orb);}
for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,d=8+Math.random()*10;const f=new THREE.Mesh(GEO.oct,mat(0xFFE08A));
f.position.set(Math.cos(a)*d,.3+Math.random()*.6,Math.sin(a)*d);const s=.18;f.scale.set(s,s,s);scene.add(f);}
""",
}

PAGE_TOP = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>__TITLE__ — 3D Simulator</title>
<link rel="icon" href="../favicon.ico" />
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Comic Sans MS","Chalkboard SE","Segoe UI",sans-serif; overflow:hidden; color:#fff; }
  #app { position:fixed; inset:0; }
  .hud { position:fixed; top:0; left:0; right:0; padding:14px 18px; display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; z-index:10; }
  .title { font-size:1.4rem; font-weight:700; text-shadow:0 2px 6px rgba(0,0,0,.45); }
  .sub { font-size:.85rem; color:#eaffd6; margin-bottom:8px; }
  .back { pointer-events:auto; display:inline-block; text-decoration:none; color:#fff; background:rgba(0,0,0,.28); border:2px solid rgba(255,255,255,.4); padding:8px 14px; border-radius:999px; font-size:.9rem; }
  .back:hover { background:rgba(0,0,0,.45); }
  .panel { position:fixed; right:16px; top:70px; background:rgba(0,0,0,.4); border:2px solid rgba(255,255,255,.3); border-radius:18px; padding:14px 16px; z-index:15; width:210px; }
  .panel h3 { font-size:1rem; margin-bottom:8px; }
  .panel .egg-count { font-size:1.6rem; font-weight:700; color:#ffe08a; }
  .panel .prompt { font-size:.85rem; color:#eaffd6; margin-top:6px; line-height:1.4; }
  .panel .ok { margin-top:10px; width:100%; background:#ffe08a; color:#3a2b00; border:none; border-radius:999px; padding:10px; font-size:1rem; font-weight:700; cursor:pointer; font-family:inherit; }
  .panel .ok:disabled { background:#C9CFD8; color:#8A93A0; opacity:1; cursor:default; }
  .bubble { position:fixed; left:50%; bottom:210px; transform:translateX(-50%); background:rgba(35,55,18,.96); border:3px solid rgba(255,255,255,.35); border-radius:24px; padding:16px 22px; max-width:min(90vw,400px); text-align:center; z-index:20; box-shadow:0 10px 34px rgba(0,0,0,.5); opacity:0; pointer-events:none; transition:opacity .3s; }
  .bubble.show { opacity:1; pointer-events:auto; }
  .bubble h3 { font-size:1.25rem; margin-bottom:4px; }
  .bubble p { font-size:1rem; line-height:1.45; }
  .bubble .sound { margin-top:8px; background:#eaffd6; color:#2a4a10; border:none; border-radius:999px; padding:9px 16px; font-size:.95rem; font-weight:700; cursor:pointer; font-family:inherit; }
  .bubble .close { margin-left:8px; background:rgba(255,255,255,.2); color:#fff; border:none; border-radius:999px; padding:9px 14px; font-size:.95rem; cursor:pointer; font-family:inherit; }
</style>
</head>
<body>
<div id="app"></div>
<div class="hud">
  <div><div class="title"><svg class="t-ico" viewBox="0 0 24 24" aria-hidden="true">__ICON__</svg>__TITLE__<div class="sub">__SUB__</div></div>
  <a class="back" href="../index.html"><svg class="t-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/></svg>Home</a></div>
</div>
<div class="panel">
  <h3>__COUNTEMOJI__ __COUNTNAME__</h3>
  <div class="egg-count" id="eggCount">0 / 0</div>
  <div class="prompt" id="prompt">__COUNTPROMPT__</div>
  <button class="ok" id="checkBtn" disabled>Count them!</button>
</div>
<div class="bubble" id="bubble">
  <h3 id="bTitle"></h3><p id="bText"></p>
  <div><button class="sound" id="bRead">🔊 Play sound</button><button class="close" id="bClose">✕</button></div>
</div>

<link rel="stylesheet" href="../assets/kid-lib.css">
<script type="importmap">
{ "imports": { "three":"https://unpkg.com/three@0.160.0/build/three.module.js", "three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/" } }
</script>
<script src="../assets/kid-lib.js"></script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import '../assets/realism.js';
window.__THREE = THREE;

const SUBJECTS = __SUBJECTS__;

// WebAudio blips, one pitch per subject
const actx = (()=>{ try{ return new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } })();
function blip(freq, dur){
  if(!actx) return; if(actx.state==='suspended') actx.resume();
  const t0=actx.currentTime, osc=actx.createOscillator(), g=actx.createGain();
  osc.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(0.001,t0);
  g.gain.exponentialRampToValueAtTime(0.4,t0+0.03); g.gain.exponentialRampToValueAtTime(0.001,t0+(dur||0.5));
  osc.type='square'; osc.frequency.setValueAtTime(freq||440,t0);
  osc.start(t0); osc.stop(t0+(dur||0.5)+0.05);
}

function mat(c){ return new THREE.MeshStandardMaterial({ color:c, roughness:0.85 }); }
const GEO = {
  sph:new THREE.SphereGeometry(1,20,16), box:new THREE.BoxGeometry(1,1,1),
  cyl:new THREE.CylinderGeometry(1,1,1,14), cone:new THREE.ConeGeometry(1,1,14),
  tor:new THREE.TorusGeometry(1,0.12,10,28), arc:new THREE.TorusGeometry(1,0.09,8,20,Math.PI),
  oct:new THREE.OctahedronGeometry(1)
};
function M(parent,geo,c,x,y,z,sx,sy,sz,o){
  const m=new THREE.Mesh(geo, mat(c));
  m.position.set(x,y,z);
  m.scale.set(sx===undefined?1:sx, sy===undefined?1:sy, sz===undefined?1:sz);
  o=o||{};
  if(o.rx) m.rotation.x=o.rx; if(o.ry) m.rotation.y=o.ry; if(o.rz) m.rotation.z=o.rz;
  if(o.emissive){ m.material.emissive=new THREE.Color(o.emissive); m.material.emissiveIntensity=(o.ei===undefined?0.6:o.ei); }
  if(o.opacity!==undefined){ m.material.transparent=true; m.material.opacity=o.opacity; }
  if(o.rough!==undefined) m.material.roughness=o.rough;
  if(o.metal!==undefined) m.material.metalness=o.metal;
  m.castShadow=(o.shadow!==false); m.receiveShadow=!!o.recv;
  parent.add(m); return m;
}
function eyes(g,x,y,z,s){
  s=s||1;
  const w=mat(0xFFFFFF), p=mat(0x1A1A22);
  for(const sd of [-1,1]){
    const e=new THREE.Mesh(GEO.sph,w); e.position.set(x+sd*0.16*s,y,z); e.scale.set(0.11*s,0.13*s,0.08*s); g.add(e);
    const u=new THREE.Mesh(GEO.sph,p); u.position.set(x+sd*0.16*s,y-0.01*s,z+0.06*s); u.scale.set(0.05*s,0.06*s,0.04*s); g.add(u);
  }
}
function earPair(b,c,x,y,z,kind){
  for(const sd of [-1,1]){
    if(kind==='pointy') M(b,GEO.cone,c, x+sd*0.2,y,z, .12,.12,.35);
    else M(b,GEO.sph,c, x+sd*0.22,y,z, .12,.12,.12);
  }
}
function wingPair(b,c,x,y,z,s){
  for(const sd of [-1,1]) M(b,GEO.box,c, x+sd*0.85*s,y,z, .95*s,.08*s,.6*s,{rz:sd*0.35});
}
function mouth(b,mood){
  const mc=0x4A2A22;
  if(mood==='happy') M(b,GEO.arc,mc, 0,0.95,0.68, .28,.28,.28,{rz:Math.PI});
  else if(mood==='sad') M(b,GEO.arc,mc, 0,0.75,0.68, .26,.26,.26,{});
  else if(mood==='angry'){ M(b,GEO.arc,mc, 0,0.72,0.68, .26,.26,.26,{}); M(b,GEO.box,mc, -0.25,1.5,0.6, .3,.07,.06,{rz:-0.4}); M(b,GEO.box,mc, 0.25,1.5,0.6, .3,.07,.06,{rz:0.4}); }
  else if(mood==='scared'){ M(b,GEO.tor,mc, 0,0.8,0.68, .12,.12,.12); }
  else if(mood==='ooh'){ M(b,GEO.tor,mc, 0,0.8,0.68, .17,.2,.12); M(b,GEO.box,mc, -0.25,1.55,0.6, .3,.07,.06,{rz:0.25}); M(b,GEO.box,mc, 0.25,1.55,0.6, .3,.07,.06,{rz:-0.25}); }
  else M(b,GEO.arc,mc, 0,0.92,0.68, .18,.18,.18,{rz:Math.PI});
  for(const sd of [-1,1]) M(b,GEO.sph,0xFF9FB0, sd*0.42,0.95,0.55, .1,.08,.06,{shadow:false});
}
function prop(b,s){
  const c1=s.c1, c2=(s.c2===undefined?s.c1:s.c2), k=s.ptype||'chest';
  if(k==='chest'){
    M(b,GEO.box,c1, 0,0.4,0, 1.2,.8,.8);
    M(b,GEO.cyl,c1, 0,0.8,0, .4,.4,1.2,{rz:Math.PI/2});
    M(b,GEO.box,0xFFD166, -0.4,0.45,0, .12,.9,.9); M(b,GEO.box,0xFFD166, 0.4,0.45,0, .12,.9,.9);
    M(b,GEO.box,0xFFD166, 0,0.45,0.42, .25,.3,.06);
    eyes(b,0,0.45,0.45,0.8);
  } else if(k==='vehicle'){
    M(b,GEO.box,c1, 0,0.65,0, 1.4,.5,.9);
    M(b,GEO.box,c2, -0.2,1.1,0, .7,.4,.7);
    M(b,GEO.box,0x5FE8F0, 0.18,1.1,0, .3,.28,.72,{emissive:0x5FE8F0,ei:.4});
    for(const wx of [-0.5,0.5]) for(const wz of [-0.5,0.5]) M(b,GEO.cyl,0x2B2B33, wx,0.3,wz, .3,.3,.2,{rx:Math.PI/2});
    M(b,GEO.cyl,c1, 0.5,1.5,0, .04,.04,.7); M(b,GEO.sph,0xFF5A5A, 0.5,1.9,0, .09,.09,.09,{emissive:0xFF5A5A,ei:.8});
    eyes(b,-0.2,0.65,0.48,0.8);
  } else if(k==='satellite'){
    M(b,GEO.box,c1, 0,1.2,0, .7,.7,.7);
    M(b,GEO.box,c2, -0.95,1.2,0, 1.1,.5,.08); M(b,GEO.box,c2, 0.95,1.2,0, 1.1,.5,.08);
    M(b,GEO.cone,c1, 0,0.6,0, .3,.3,.4,{rx:Math.PI});
    M(b,GEO.sph,0x5FE8F0, 0,1.35,0.36, .12,.12,.12,{emissive:0x5FE8F0,ei:.8});
    M(b,GEO.cyl,c1, 0,0.25,0, .12,.12,.5);
  } else if(k==='boat'){
    M(b,GEO.box,0x6A452A, 0,0.5,0, 1.5,.7,2.6);
    M(b,GEO.box,c1, 0,0.9,0, 1.7,.15,2.8);
    M(b,GEO.cyl,0x5A3A22, 0,2.0,0, .09,.09,2.8);
    M(b,GEO.box,c1, 0,2.2,0.75, 1.4,1.4,.1);
    M(b,GEO.box,c2, 0,3.2,0, .7,.45,.08);
    eyes(b,0,0.5,1.32,0.9);
  } else if(k==='buoy'){
    M(b,GEO.sph,c1, 0,0.55,0, .5,.55,.5);
    M(b,GEO.cyl,c2, 0,0.65,0, .51,.51,.18);
    M(b,GEO.cone,c1, 0,1.25,0, .2,.2,.4);
    M(b,GEO.sph,0xFFD166, 0,1.5,0, .1,.1,.1,{emissive:0xFFD166,ei:.7});
    eyes(b,0,0.35,0.45,0.9);
  } else if(k==='arch'){
    M(b,GEO.tor,c1, 0,0.9,0, 1.0,1.0,1.0);
    M(b,GEO.sph,0x2A1808, 0,0.6,0, .65,.6,.3);
    M(b,GEO.sph,c2, -0.9,0.15,0.3, .3,.2,.3); M(b,GEO.sph,c2, 0.9,0.15,-0.2, .25,.18,.25);
  } else if(k==='kite'){
    M(b,GEO.oct,c1, 0,1.6,0, .7,.9,.16);
    M(b,GEO.oct,c2, 0,1.6,0.05, .35,.45,.16);
    M(b,GEO.cyl,0xFFFFFF, 0,0.7,0, .02,.02,1.4);
    for(let i=0;i<3;i++) M(b,GEO.box,c2, (i%2?0.12:-0.12),0.35+i*0.35,0, .18,.12,.04,{rz:(i%2?0.5:-0.5)});
    eyes(b,0,1.75,0.14,0.8);
  } else if(k==='plane'){
    M(b,GEO.sph,c1, 0,1.0,0, .42,.42,1.1);
    M(b,GEO.box,c2, 0,1.05,0.1, 2.3,.12,.55);
    M(b,GEO.box,c2, 0,1.35,-0.95, .12,.5,.4);
    M(b,GEO.sph,0x5FE8F0, 0,1.35,0.35, .22,.2,.25,{emissive:0x5FE8F0,ei:.4});
    M(b,GEO.box,0x2B2B33, 0,1.0,1.15, .5,.4,.12);
    eyes(b,0,1.05,0.95,0.7);
  } else if(k==='flask'){
    M(b,GEO.sph,c1, 0,0.62,0, .62,.62,.62,{opacity:.9});
    M(b,GEO.sph,c2, 0,0.45,0, .45,.35,.45,{emissive:c2,ei:.3});
    M(b,GEO.cyl,c1, 0,1.35,0, .2,.2,.7);
    eyes(b,0,0.65,0.5,0.8);
  } else if(k==='tube'){
    M(b,GEO.cyl,c1, 0,0.75,0, .26,.26,1.2,{opacity:.9});
    M(b,GEO.cyl,c2, 0,0.45,0, .2,.2,.6,{emissive:c2,ei:.3});
    M(b,GEO.cyl,0x8A5A9A, 0,1.4,0, .28,.28,.15);
    eyes(b,0,0.9,0.22,0.7);
  } else if(k==='magnet'){
    M(b,GEO.cyl,c1, -0.3,0.8,0, .2,.2,1.1); M(b,GEO.cyl,c1, 0.3,0.8,0, .2,.2,1.1);
    M(b,GEO.box,c1, 0,1.35,0, .8,.35,.4);
    M(b,GEO.cyl,0xF0F2F5, -0.3,0.3,0, .21,.21,.25); M(b,GEO.cyl,0xF0F2F5, 0.3,0.3,0, .21,.21,.25);
    eyes(b,0,1.35,0.22,0.7);
  } else if(k==='arm'){
    M(b,GEO.cyl,c2, 0,0.2,0, .45,.45,.4);
    M(b,GEO.box,c1, 0,0.8,0, .3,.9,.3,{rz:0.3});
    M(b,GEO.sph,c2, 0,1.25,0.15, .18,.18,.18);
    M(b,GEO.box,c1, 0.25,1.6,0.3, .22,.7,.22,{rz:-0.5});
    M(b,GEO.box,c2, 0.5,1.85,0.45, .12,.3,.12,{rz:-0.5}); M(b,GEO.box,c2, 0.62,1.8,0.45, .12,.3,.12,{rz:-0.5});
    M(b,GEO.sph,0x5FE8F0, 0,1.25,0.33, .08,.08,.08,{emissive:0x5FE8F0,ei:.8});
  } else if(k==='crystal'){
    M(b,GEO.sph,0x8A8F98, 0,0.15,0, .6,.25,.6);
    M(b,GEO.oct,c1, 0,0.8,0, .5,.8,.5,{emissive:c2,ei:.25});
    M(b,GEO.oct,c2, 0.45,0.45,0.2, .25,.4,.25);
    eyes(b,0,0.7,0.42,0.7);
  } else if(k==='banner'){
    M(b,GEO.cyl,0x5A3A22, 0,1.1,0, .09,.09,2.4);
    M(b,GEO.box,c1, 0.45,1.9,0, .85,.7,.06);
    M(b,GEO.box,c2, 0.45,1.9,0.02, .35,.3,.06);
    M(b,GEO.sph,0xFFD166, 0,2.4,0, .14,.14,.14);
    M(b,GEO.cyl,0x8A8F98, 0,0.1,0, .35,.35,.2);
  } else if(k==='torch'){
    M(b,GEO.cyl,c1, 0,0.7,0, .1,.1,1.4,{rz:0.08});
    M(b,GEO.cyl,0x3A2418, -0.05,1.35,0, .16,.16,.2);
    M(b,GEO.cone,0xFF7A2A, -0.05,1.75,0, .22,.22,.5,{emissive:0xFF7A2A,ei:.9});
    M(b,GEO.cone,0xFFD94A, -0.05,1.68,0, .12,.12,.3,{emissive:0xFFD94A,ei:1});
  } else if(k==='catapult'){
    M(b,GEO.box,c1, 0,0.55,0, 1.4,.25,.7);
    for(const wx of [-0.5,0.5]) for(const wz of [-0.25,0.25]) M(b,GEO.cyl,c2, wx,0.28,wz, .28,.28,.15,{rx:Math.PI/2});
    M(b,GEO.cyl,c1, 0,1.0,-0.1, .09,.09,1.6,{rx:0.7});
    M(b,GEO.sph,0x3A3F48, 0,1.65,-0.62, .3,.2,.3);
    eyes(b,0,0.55,0.37,0.8);
  } else {
    M(b,GEO.box,c1, 0,0.5,0, 1.0,.9,.9);
    eyes(b,0,0.6,0.48,0.8);
  }
}
function toy(s){
  const g=new THREE.Group(), b=new THREE.Group(); g.add(b);
  const c1=s.c1, c2=(s.c2===undefined?s.c1:s.c2), skin=s.skin||0xF2C89B;
  const ex=s.extra||'', sh=s.shape||'blob';
  if(sh==='quad'){
    M(b,GEO.sph,c1, 0,0.75,0, .72,.72,1.05);
    M(b,GEO.sph,c1, 0,1.15,0.95, .36,.36,.36);
    M(b,GEO.sph,c2, 0,1.05,1.28, .18,.16,.18);
    eyes(b,0,1.25,1.24,1);
    for(const lx of [-0.35,0.35]) for(const lz of [-0.5,0.5]) M(b,GEO.cyl,c2, lx,0.3,lz, .1,.1,0.6);
    M(b,GEO.cone,c2, 0,0.9,-1.05, .12,.12,.5,{rx:-Math.PI/2});
    if(ex==='hump') M(b,GEO.sph,c1, 0,1.35,-0.1, .4,.42,.5);
    if(ex==='mane'){ for(let i=0;i<4;i++) M(b,GEO.cone,0x3A2418, 0,1.5-i*0.18,-0.3+i*0.26, .12,.12,.28,{rx:-0.5}); }
    else if(ex==='pointy') earPair(b,c1,0,1.5,0.85,'pointy');
    else earPair(b,c1,0,1.48,0.9,'round');
    if(ex==='wings') wingPair(b,c2,0,1.0,-0.3,1.1);
  } else if(sh==='bird'){
    M(b,GEO.sph,c1, 0,0.8,0, .62,.7,.62);
    M(b,GEO.sph,c1, 0,1.5,0.1, .34,.34,.34);
    M(b,GEO.cone,c2, 0,1.45,0.5, .12,.12,.3,{rx:Math.PI/2});
    eyes(b,0,1.6,0.38,0.9);
    M(b,GEO.box,c2, -0.62,0.85,0, .18,.5,.7); M(b,GEO.box,c2, 0.62,0.85,0, .18,.5,.7);
    M(b,GEO.box,c2, 0,0.85,-0.65, .3,.12,.4);
    M(b,GEO.cyl,c2, -0.15,0.15,0, .05,.05,.3); M(b,GEO.cyl,c2, 0.15,0.15,0, .05,.05,.3);
  } else if(sh==='human'){
    M(b,GEO.cyl,0x3A3F48, -0.16,0.3,0, .11,.11,0.6); M(b,GEO.cyl,0x3A3F48, 0.16,0.3,0, .11,.11,0.6);
    M(b,GEO.cyl,c1, 0,0.95,0, .34,.34,0.8);
    M(b,GEO.cyl,c1, -0.44,0.95,0, .09,.09,0.6,{rz:0.25}); M(b,GEO.cyl,c1, 0.44,0.95,0, .09,.09,0.6,{rz:-0.25});
    M(b,GEO.sph,skin, -0.52,0.68,0, .1,.1,.1); M(b,GEO.sph,skin, 0.52,0.68,0, .1,.1,.1);
    M(b,GEO.sph,skin, 0,1.7,0, .34,.36,.34);
    eyes(b,0,1.72,0.3,1);
    if(ex==='pirate'){ M(b,GEO.cyl,0x2B2B33, 0,2.0,0, .44,.44,0.16); M(b,GEO.box,0x2B2B33, 0,2.0,0, .9,.16,.3); }
    else if(ex==='helmet') M(b,GEO.sph,c2, 0,1.78,0, .42,.36,.42,{opacity:.55});
    else if(ex==='sailor') M(b,GEO.cyl,0xF0F2F5, 0,2.02,0, .27,.27,0.12);
    else if(ex==='cap'){ M(b,GEO.cyl,c2, 0,2.0,0, .3,.3,0.14); M(b,GEO.box,c2, 0,1.95,0.4, .34,.08,.3); }
    else if(ex==='goggles'){ for(const sd of [-1,1]) M(b,GEO.tor,0x3A3F48, sd*0.14,1.76,0.28, .11,.11,.11); }
    else if(ex==='antennae'){ for(const sd of [-1,1]){ M(b,GEO.cyl,c2, sd*0.15,2.1,0, .03,.03,.4,{rz:-sd*0.3}); M(b,GEO.sph,0xFF5A5A, sd*0.22,2.3,0, .06,.06,.06,{emissive:0xFF5A5A,ei:.8}); } }
  } else if(sh==='fish'){
    M(b,GEO.sph,c1, 0,0.9,0, .5,.55,.85);
    M(b,GEO.cone,c2, 0,0.9,-0.95, .35,.5,.35,{rx:-Math.PI/2});
    M(b,GEO.cone,c2, 0,1.45,-0.1, .18,.18,.35);
    eyes(b,0,1.0,0.72,0.9);
  } else if(sh==='face'){
    M(b,GEO.sph,c1, 0,1.0,0, .8,.85,.75);
    eyes(b,0,1.2,0.62,1.1);
    mouth(b,s.mood||'happy');
    M(b,GEO.cyl,c1, -0.85,0.5,0, .1,.1,.6,{rz:0.3}); M(b,GEO.cyl,c1, 0.85,0.5,0, .1,.1,.6,{rz:-0.3});
  } else if(sh==='bug'){
    M(b,GEO.sph,c1, 0,0.45,0, .55,.45,.8);
    M(b,GEO.sph,c1, 0,0.55,0.75, .3,.3,.3);
    eyes(b,0,0.65,1.0,0.8);
    for(const sd of [-1,1]) for(const lz of [-0.4,0,0.4]) M(b,GEO.cyl,c2, sd*0.62,0.25,lz, .05,.05,.5,{rz:sd*0.9});
    for(const sd of [-1,1]){ M(b,GEO.cyl,c2, sd*0.12,0.9,0.85, .03,.03,.35,{rx:0.5}); M(b,GEO.sph,c2, sd*0.12,1.05,1.0, .05,.05,.05); }
    if(ex==='spots'){ M(b,GEO.sph,0x111111, -0.25,0.82,-0.2, .12,.1,.12); M(b,GEO.sph,0x111111, 0.25,0.82,-0.2, .12,.1,.12); M(b,GEO.sph,0x111111, 0,0.85,0.25, .1,.09,.1); }
  } else if(sh==='plant'){
    if(ex==='flatleaf'){
      M(b,GEO.cyl,c2, 0,0.25,0, .12,.12,.5);
      M(b,GEO.sph,c1, 0,0.7,0, 1.0,.14,.55,{ry:0.5});
    } else {
      M(b,GEO.cyl,c2, 0,0.6,0, .16,.16,1.2);
      for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; M(b,GEO.sph,c1, Math.cos(a)*0.6,1.45+(k%2)*0.25,Math.sin(a)*0.6, .55,.18,.3,{ry:-a}); }
      M(b,GEO.sph,c1, 0,1.7,0, .4,.3,.4);
      if(c1===0xFF9FB0) M(b,GEO.sph,0xFFD166, 0,1.85,0, .15,.12,.15);
    }
  } else if(sh==='prop'){
    prop(b,s);
  } else {
    M(b,GEO.sph,c1, 0,0.6,0, .75,.62,.75);
    M(b,GEO.sph,c2, 0,0.5,0.45, .45,.4,.3);
    eyes(b,0,0.95,0.55,1.1);
    if(ex==='shell') M(b,GEO.sph,c2, 0,0.78,-0.15, .58,.48,.58);
    if(ex==='bugeyes'){ for(const sd of [-1,1]){ M(b,GEO.cyl,c1, sd*0.2,1.15,0.3, .06,.06,.4); const w=new THREE.Mesh(GEO.sph,mat(0xFFFFFF)); w.position.set(sd*0.2,1.4,0.3); w.scale.set(.16,.16,.14); b.add(w); const u=new THREE.Mesh(GEO.sph,mat(0x1A1A22)); u.position.set(sd*0.2,1.4,0.42); u.scale.set(.07,.07,.05); b.add(u); } }
    if(ex==='puffy'){ M(b,GEO.sph,c1, -0.6,0.5,0, .5,.42,.5); M(b,GEO.sph,c1, 0.6,0.5,0, .5,.42,.5); }
    if(ex==='antennae'){ for(const sd of [-1,1]){ M(b,GEO.cyl,c2, sd*0.2,1.3,-0.1, .04,.04,.5,{rz:-sd*0.3}); M(b,GEO.sph,c2, sd*0.3,1.55,-0.1, .08,.08,.08); } }
  }
  const sh2=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.16}));
  sh2.position.y=0.03; g.add(sh2);
  const S=s.scale||1; b.scale.setScalar(S); sh2.scale.set(0.95*S,0.08,0.95*S);
  return g;
}
function countItem(kind,i){
  const g=new THREE.Group();
  if(kind==='dates'){ M(g,GEO.sph,0x6A3A1A, 0,0,0, .28,.36,.28); M(g,GEO.cyl,0x3A5A2A, 0,0.38,0, .04,.04,.15); }
  else if(kind==='coins'){ M(g,GEO.cyl,0xFFD166, 0,0,0, .3,.3,.1,{metal:.6,rough:.35,emissive:0x7A5A00,ei:.25}); }
  else if(kind==='flags'){ M(g,GEO.cyl,0x8A8F98, 0,0.5,0, .05,.05,1.0); M(g,GEO.box,0x3A6FD0, 0.32,0.8,0, .55,.35,.05); }
  else if(kind==='bubbles'){ M(g,GEO.sph,0xCFEFFF, 0,0,0, .28,.28,.28,{opacity:.55,rough:.1}); }
  else if(kind==='shields'){ M(g,GEO.cyl,0x8A93A0, 0,0,0, .42,.42,.12,{rx:Math.PI/2}); M(g,GEO.sph,0xD84040, 0,0,0.12, .14,.14,.14); }
  else if(kind==='tadpoles'){ M(g,GEO.sph,0x2A3A2A, 0,0,0, .22,.22,.3); M(g,GEO.cone,0x2A3A2A, 0,0,-0.38, .08,.08,.35,{rx:-Math.PI/2}); }
  else if(kind==='buoys'){ M(g,GEO.sph,0xE04040, 0,0,0, .3,.35,.3); M(g,GEO.cyl,0xF0F2F5, 0,0.1,0, .31,.31,.12); M(g,GEO.cone,0xE04040, 0,0.52,0, .12,.12,.25); }
  else if(kind==='crumbs'){ M(g,GEO.sph,0xD8B878, 0,0,0, .22,.18,.22); }
  else if(kind==='minis'){ const cols=[0xFF5A7A,0xFFB347,0x5EC4E8,0x8FD86A,0xC88FFF,0xFF8FB0]; M(g,GEO.sph,cols[i%6], 0,0,0, .32,.38,.32); M(g,GEO.cyl,0x8A7A5A, 0,-0.52,0, .03,.03,.3); }
  else if(kind==='hearts'){ M(g,GEO.sph,0xFF5A7A, -0.14,0.1,0, .2,.2,.2); M(g,GEO.sph,0xFF5A7A, 0.14,0.1,0, .2,.2,.2); M(g,GEO.cone,0xFF5A7A, 0,-0.14,0, .28,.28,.35,{rx:Math.PI}); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return g;
}
"""

PAGE_BOTTOM = """
const groundTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');
  g.fillStyle='__GROUNDCSS__'; g.fillRect(0,0,256,256);
  for(let i=0;i<900;i++){ g.fillStyle='rgba(20,40,10,'+(0.06+Math.random()*0.16)+')'; g.beginPath(); g.arc(Math.random()*256,Math.random()*256,2+Math.random()*5,0,7); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,3); return t; })();

const scene=new THREE.Scene();
scene.background=new THREE.Color(__SKYBOT__);
scene.fog=new THREE.Fog(__SKYBOT__, 55, 140);
const camera=new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 400);
camera.position.set(0,9,22);
const renderer=new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.92;
document.getElementById('app').appendChild(renderer.domElement);
const fx = Realism.setup(scene, renderer, camera, {
  hdr: "../assets/hdr/sky-park-small.hdr",
  sky: 'gradient',
  skyOptions: { top: __SKYTOP__, bottom: __SKYBOT__, sun: new THREE.Vector3(-0.4, 0.55, -0.75), sunSize: 120 },
  bloom: 'gentle'
});
window.fx = fx;
KidLib.ambience('__AMB__');
const controls=new OrbitControls(camera, renderer.domElement);
controls.enableDamping=true; controls.target.set(0,2,0); controls.maxDistance=55; controls.minDistance=5;

scene.add(new THREE.AmbientLight(0xc8e8ff, 0.75));
const sun=new THREE.DirectionalLight(0xfff5d8, 1.6); sun.position.set(12,20,10); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-28; sun.shadow.camera.right=28;
sun.shadow.camera.top=28; sun.shadow.camera.bottom=-28; scene.add(sun);
scene.add(new THREE.HemisphereLight(0xd0ffe0, 0x3f5a2f, 0.45));

const ground=new THREE.Mesh(new THREE.CircleGeometry(24,56), new THREE.MeshStandardMaterial({ map:groundTex, roughness:1 }));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

// fence ring at the horizon (farm-pattern chrome)
(function(){
  const fmat=new THREE.MeshStandardMaterial({ color:0xC89B6A, roughness:0.9 });
  const N=30, R=22, pts=[];
  for(let k=0;k<N;k++){
    const a=k/N*Math.PI*2, x=Math.cos(a)*R, z=Math.sin(a)*R;
    pts.push(new THREE.Vector3(x,0,z));
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.13,1.7,8), fmat);
    post.position.set(x,0.85,z); post.castShadow=true; scene.add(post);
  }
  const dir=new THREE.Vector3(), mid=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
  for(let k=0;k<N;k++){
    const a=pts[k], b2=pts[(k+1)%N];
    dir.subVectors(b2,a); const len=dir.length();
    for(const h of [0.65,1.25]){
      const rail=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,len,6), fmat);
      mid.addVectors(a,b2).multiplyScalar(0.5); mid.y=h;
      rail.position.copy(mid);
      rail.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      rail.castShadow=true; scene.add(rail);
    }
  }
})();

// centerpiece + pale-blue decal under it
const center=new THREE.Group(); center.position.set(0,0,-14); scene.add(center);
__CENTER__
const decal=new THREE.Mesh(new THREE.CircleGeometry(1,28), new THREE.MeshStandardMaterial({color:0xBFD3E2, roughness:1}));
decal.rotation.x=-Math.PI/2; decal.position.set(0,0.03,-14); decal.scale.set(2.6,0.6,1); scene.add(decal);

__SCATTER__

// subjects ringed around the field
const toys=[];
SUBJECTS.forEach((s,i)=>{
  const g=toy(s);
  const angle=(i/SUBJECTS.length)*Math.PI*2;
  g.position.set(Math.cos(angle)*8, 0, Math.sin(angle)*8);
  g.rotation.y=-angle+Math.PI;
  g.userData.baseY=0; g.userData.idx=i;
  const lbl=KidLib.makeLabel(s.name); lbl.position.y=3.0; g.add(lbl);
  scene.add(g); toys.push(g);
});

// hidden counting items around the centerpiece
const hidden=[];
for(let i=0;i<__ITEMN__;i++){
  const it=countItem('__ITEM__',i);
  const a=(i/__ITEMN__)*Math.PI*2;
  it.position.set(Math.cos(a)*__HR__, __HY__+(i%2)*0.4, Math.sin(a)*__HR__);
  it.visible=false; it.scale.setScalar(0.01); center.add(it); hidden.push(it);
}
let revealed=false, revealT=0;

KidLib.pulse(scene, toys[0].position, 0xffd166);
const bubble=document.getElementById('bubble'), bTitle=document.getElementById('bTitle'), bText=document.getElementById('bText');
let current=-1;
function showInfo(i){ const s=SUBJECTS[i]; current=i; bTitle.textContent=s.name; bText.textContent=s.name+' says... '+s.fact; bubble.classList.add('show'); blip(s.freq||440, 0.5); }
document.getElementById('bClose').onclick=()=>bubble.classList.remove('show');
document.getElementById('bRead').onclick=()=>{ if(current>=0) blip(SUBJECTS[current].freq||440, 0.5); KidLib.speak(bText.textContent); };

const countEl=document.getElementById('eggCount'), promptEl=document.getElementById('prompt'), checkBtn=document.getElementById('checkBtn');
checkBtn.onclick=()=>{
  countEl.textContent='__ITEMN__ / __ITEMN__';
  promptEl.textContent='__COUNTDONE__';
  blip(880, 0.3); setTimeout(()=>blip(1174, 0.4), 180);
  checkBtn.disabled=true;
};
function reveal(){
  if(revealed) return; revealed=true; revealT=0.0001;
  hidden.forEach(x=>{ x.visible=true; });
  countEl.textContent='0 / __ITEMN__';
  promptEl.textContent='Count what you see, then press "Count them!"';
  checkBtn.disabled=false;
}

const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
function findRoot(obj){
  let o=obj;
  while(o){
    if(o===center) return 'center';
    if(o.userData && o.userData.idx!==undefined) return o.userData.idx;
    o=o.parent;
  }
  return -1;
}
renderer.domElement.addEventListener('pointerdown',e=>{
  pointer.x=(e.clientX/innerWidth)*2-1; pointer.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(scene.children,true);
  for(const h of hits){
    const f=findRoot(h.object);
    if(f==='center'){ reveal(); return; }
    if(typeof f==='number'&&f>=0){ showInfo(f); return; }
  }
});

const clock=new THREE.Clock();
(function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  toys.forEach((g,i)=>{ g.position.y=Math.sin(t*1.2+i)*0.06; });
  if(revealT>0){
    revealT+=0.03;
    hidden.forEach((h,i)=>{ const s2=Math.min(1,revealT-i*0.06); h.scale.setScalar(Math.max(0.01,s2)); h.rotation.y+=0.01; });
    if(revealT>2) revealT=0;
  }
  controls.update(); if(window.KidLib)KidLib.updateLabels(scene,camera); fx.render(scene, camera);
})();
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
const TIPS=__TIPS__;
const QUIZ=__QUIZ__;
window.__MORE=__MORE__;
KidLib.init({tips:TIPS, quiz:QUIZ});
</script>
</body>
</html>
"""

# ------------------------------------------------------------ file writers
def hex6(n):
    return '#%06X' % (n & 0xFFFFFF)

def js_str(s):
    return json.dumps(s)

def subject_js(s):
    parts = ['name:' + js_str(s['name']), 'shape:' + js_str(s['shape']),
             'c1:' + hex(s['c1']), 'fact:' + js_str(s['fact']), 'freq:' + str(s.get('freq', 440))]
    for k in ('c2', 'skin'):
        if k in s:
            parts.append(k + ':' + hex(s[k]))
    for k in ('scale', 'extra', 'mood', 'ptype'):
        if k in s:
            parts.append(k + ':' + (js_str(s[k]) if isinstance(s[k], str) else str(s[k])))
    return '{' + ','.join(parts) + '}'

def page_html(g):
    c = CENTERS[g['folder']]
    h = PAGE_TOP
    h = h.replace('__TITLE__', g['title']).replace('__ICON__', g['icon']).replace('__SUB__', g['sub'])
    h = h.replace('__COUNTEMOJI__', g['emoji']).replace('__COUNTNAME__', g['countName'])
    h = h.replace('__COUNTPROMPT__', g['countPrompt'])
    h = h.replace('__SUBJECTS__', '[' + ','.join(subject_js(s) for s in g['subjects']) + ']')
    b = PAGE_BOTTOM
    b = b.replace('__GROUNDCSS__', hex6(g['ground']))
    b = b.replace('__SKYTOP__', hex(g['skyTop'])).replace('__SKYBOT__', hex(g['skyBot']))
    b = b.replace('__AMB__', g['amb'])
    b = b.replace('__CENTER__', c['code']).replace('__SCATTER__', SCATTERS[g['folder']])
    b = b.replace('__ITEM__', g['item']).replace('__ITEMN__', str(g['itemN']))
    b = b.replace('__HR__', str(c['hr'])).replace('__HY__', str(c['hy']))
    b = b.replace('__COUNTDONE__', g['countDone'])
    b = b.replace('__TIPS__', json.dumps(g['tips']))
    b = b.replace('__QUIZ__', json.dumps([dict(q=q['q'], opts=q['opts'], ans=q['ans']) for q in g['quiz']]))
    b = b.replace('__MORE__', json.dumps({s['name']: [s['more']] for s in g['subjects']}))
    return h + b

GRADIENTS = [
    ('#E0A83A', '#8A5A2A'), ('#5A6A8A', '#1A1A2A'), ('#8A93B0', '#3A3A5A'),
    ('#FF9FB0', '#8A4A9A'), ('#9AA2B0', '#5A3A6A'), ('#7FD18A', '#2A7A5A'),
    ('#FFD166', '#E07A3A'), ('#C8A878', '#6A4A2A'), ('#8FD0F0', '#3A6AB0'),
    ('#C88FFF', '#6A4AD0'),
]

def hub_section():
    cards = []
    for (g, (c1, c2)) in zip(GAMES, GRADIENTS):
        cards.append(
            '    <a class="card" href="{f}/index.html" style="--c1:{c1};--c2:{c2};--tint:{c1}55">\n'
            '      <span class="ico"><svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>\n'
            '      <h3>{t}</h3><p>{b}</p>\n'
            '    </a>'.format(f=g['folder'], c1=c1, c2=c2, icon=g['icon'], t=g['title'], b=g['blurb']))
    return ('  <h2><span class="dot" style="background:var(--gold);box-shadow:0 0 12px var(--gold)"></span>New Worlds</h2>\n'
            '  <main class="grid">\n' + '\n'.join(cards) + '\n  </main>\n')

def update_hub():
    p = os.path.join(ROOT, 'index.html')
    src = open(p, encoding='utf-8').read()
    start, end = '<!-- NEW-WORLDS-START -->', '<!-- NEW-WORLDS-END -->'
    block = start + '\n' + hub_section() + '  ' + end
    if start in src:
        src = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda m: block, src, flags=re.S)
    else:
        anchor = '  <div class="foot">'
        assert anchor in src, 'hub anchor missing'
        src = src.replace(anchor, block + '\n' + anchor)
    src = src.replace('21 learning worlds', '31 learning worlds')
    open(p, 'w', encoding='utf-8').write(src)

def update_readme():
    p = os.path.join(ROOT, 'README.md')
    src = open(p, encoding='utf-8').read()
    src = src.replace('Twenty-one browser-based', 'Thirty-one browser-based')
    start, end = '<!-- NEW-WORLDS-START -->', '<!-- NEW-WORLDS-END -->'
    rows = '\n'.join('| `%s` | %s | %s |' % (g['folder'], g['title'], g['blurb']) for g in GAMES)
    block = (start + '\n### ✨ New Worlds\n| Folder | Topic | What the kid learns |\n|---|---|---|\n'
             + rows + '\n' + end)
    if start in src:
        src = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda m: block, src, flags=re.S)
    else:
        if not src.endswith('\n'):
            src += '\n'
        src += '\n' + block + '\n'
    open(p, 'w', encoding='utf-8').write(src)

def update_test():
    p = os.path.join(ROOT, 'test', 'functional-test.js')
    src = open(p, encoding='utf-8').read()
    apps = re.search(r'const APPS = \[(.*?)\];', src, flags=re.S).group(1)
    have = set(re.findall(r"'([^']+)'", apps))
    add = [g['folder'] for g in GAMES if g['folder'] not in have]
    if add:
        new_apps = apps.rstrip() + '\n  ' + ', '.join("'%s'" % a for a in add) + ',\n'
        src = src.replace('const APPS = [' + apps + '];', 'const APPS = [' + new_apps + '];', 1)
        open(p, 'w', encoding='utf-8').write(src)

SHOOT_JS = """// Screenshots for the 10 new games + contact sheet.
//   node tools/shoot_new_games.js   (starts its own server on 8123)
const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const APPS = [__APPLIST__];
const SHOTS = path.join(ROOT, 'visual-plan', 'preview');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', '8123'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  let launchOpts = { args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--autoplay-policy=no-user-gesture-required'] };
  if (fs.existsSync(CHROME)) launchOpts.executablePath = CHROME;
  else { try { require('child_process').execSync('npx playwright install chromium --only-shell', { stdio: 'ignore' }); } catch (e) {} }
  let browser = null;
  try {
    browser = await chromium.launch(launchOpts);
  } catch (e) {
    console.log('browser launch failed (offline/sandbox?): ' + e.message.split('\\n')[0]);
  }
  const summary = [];
  if (!browser) {
    fs.writeFileSync(path.join(SHOTS, 'shoot-report.txt'), 'NO BROWSER — tiles rendered as data sheets\\n');
    const py = spawnSync('python3', [path.join(ROOT, 'tools', 'make_contact.py')], { cwd: ROOT, stdio: 'inherit' });
    process.exit(py.status || 0);
  }
  for (const app of APPS) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    try {
      await page.goto('http://localhost:8123/' + app + '/index.html', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(4000);
      const canvas = await page.evaluate(() => { const c = document.querySelector('#app canvas'); return c ? (c.width + 'x' + c.height) : 'MISSING'; });
      await page.screenshot({ path: path.join(SHOTS, 'shot-' + app + '.png') });
      console.log('shot ' + app + ' canvas=' + canvas + ' errors=' + errors.length);
      errors.slice(0, 3).forEach(e => console.log('   ! ' + e.slice(0, 200)));
      summary.push(app + ': canvas=' + canvas + ' errors=' + errors.length);
    } catch (e) {
      console.log('shot ' + app + ' FATAL: ' + e.message);
      summary.push(app + ': FATAL ' + e.message);
    }
    await ctx.close();
  }
  await browser.close();
  srv.kill();
  fs.writeFileSync(path.join(SHOTS, 'shoot-report.txt'), summary.join('\\n') + '\\n');
  const py = spawnSync('python3', [path.join(ROOT, 'tools', 'make_contact.py')], { cwd: ROOT, stdio: 'inherit' });
  process.exit(py.status || 0);
})();
"""

CONTACT_PY = """#!/usr/bin/env python3
\"\"\"Compose visual-plan/preview/contact.png from per-game screenshots.
Missing shots (offline/sandbox run) become labelled data-sheet tiles so the
sheet never silently claims a render that was not captured.\"\"\"
import os
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES = [__GAMEDATA__]
SH = os.path.join(ROOT, 'visual-plan', 'preview')
W, H, LABEL = 640, 448, 30
COLS = 2
def sheet_tile(g):
    im = Image.new('RGB', (W, H), (24, 26, 44))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 90], fill=tuple(int(g['ground'][i:i+2], 16) for i in (1, 3, 5)))
    d.text((16, 14), g['title'], fill=(255, 255, 255))
    d.text((16, 36), g['folder'] + '  (%d subjects, count: %s x%d)' % (len(g['subjects']), g['item'], g['itemN']), fill=(230, 230, 230))
    y = 110
    for s in g['subjects']:
        d.text((16, y), '- %s [%s] %.60s' % (s['name'], s['shape'], s['fact']), fill=(200, 210, 220))
        y += 26
    d.text((16, H - 30), 'no browser render in this env (needs network + Chrome)', fill=(255, 180, 120))
    return im
contact = Image.new('RGB', (W * COLS, (H + LABEL) * ((len(GAMES) + 1) // COLS)), (20, 22, 40))
d = ImageDraw.Draw(contact)
for i, g in enumerate(GAMES):
    p = os.path.join(SH, 'shot-%s.png' % g['folder'])
    try:
        im = Image.open(p).convert('RGB').resize((W, H))
    except Exception:
        im = sheet_tile(g)
    x, y = (i % COLS) * W, (i // COLS) * (H + LABEL)
    contact.paste(im, (x, y))
    d.text((x + 8, y + H + 7), g['folder'], fill=(255, 255, 255))
contact.save(os.path.join(SH, 'contact.png'))
print('wrote visual-plan/preview/contact.png', contact.size)
"""

def write_tools():
    applist = ', '.join("'%s'" % g['folder'] for g in GAMES)
    shoot = SHOOT_JS.replace('__APPLIST__', applist)
    open(os.path.join(ROOT, 'tools', 'shoot_new_games.js'), 'w', encoding='utf-8').write(shoot)
    gamedata = ', '.join(
        "{'folder': %s, 'title': %s, 'ground': %s, 'item': %s, 'itemN': %d, 'subjects': [%s]}" % (
            js_str(g['folder']), js_str(g['title']), js_str(hex6(g['ground'])),
            js_str(g['item']), g['itemN'],
            ', '.join("{'name': %s, 'shape': %s, 'fact': %s}" % (
                js_str(s['name']), js_str(s['shape']), js_str(s['fact'])) for s in g['subjects']))
        for g in GAMES)
    contact = CONTACT_PY.replace('__GAMEDATA__', gamedata)
    open(os.path.join(ROOT, 'tools', 'make_contact.py'), 'w', encoding='utf-8').write(contact)

def main():
    for g in GAMES:
        d = os.path.join(ROOT, g['folder'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page_html(g))
        print('wrote', g['folder'] + '/index.html')
    update_hub()
    update_readme()
    update_test()
    write_tools()
    print('hub, README, functional-test, shoot tools updated')

if __name__ == '__main__':
    main()




