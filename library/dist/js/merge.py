out = "all.js"
files = ["graph.js", "graph-utils.js","graph-tooltip.js", "circle-graph.js","relation-graph.js", "mindmap-graph.js", "badge-graph.js", "network-graph.js", "dendo-graph.js", "circle-relation-graph.js", "venn-graph.js"]
with open(out, 'w') as outfile:
    for fname in files:
        with open(fname) as infile:
            for line in infile:
                outfile.write(line)
        outfile.write("\n")
        parts = fname[:-3].split('-')
        res = ""
        for i in range(len(parts)):
            res = res + parts[i][0].upper() + parts[i][1:]
        outfile.write("window." + res + " = " + res)
        outfile.write("\n")