out = "all.js"
files = ["graph.js","graph-utils.js","graph-tooltip.js", "circle-graph.js","relation-graph.js"]
with open(out, 'w') as outfile:
    for fname in files:
        with open(fname) as infile:
            for line in infile:
                outfile.write(line)