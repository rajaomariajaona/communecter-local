const sets = ["A", "B", "C", "D", "E"];
const type = ["txt", "img"];

function randInt(min, max) {
    return Math.round(Math.random() * max + min);
}
const data = [];
for (let i = 0; i < 200; i++) {
    const num = randInt(1, sets.length);
    let set = []
    for (let j = 0; j < num; j++) {
        const s = sets[randInt(0, sets.length - 1)]
        console.log(s)
        if (!set.includes(s)) {
            set.push(s)
        }
    }

    data.push({
        type: type[randInt(0, 1)],
        name: "lol" + Math.random(),
        set
    })
}