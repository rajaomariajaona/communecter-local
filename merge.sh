cp venn.js /home/snowden/dev/communecter/docker/code/modules/graph/assets/js/venn.js
cd library/dist/js
python3 merge.py
pnpm transpile
cp all.js /home/snowden/dev/communecter/docker/code/modules/graph/assets/js/graph-src.js
cp all-compiled.js /home/snowden/dev/communecter/docker/code/modules/graph/assets/js/graph.js
cd ../css
cp graph.css /home/snowden/dev/communecter/docker/code/modules/graph/assets/css/graph.css
rm -rf /home/snowden/dev/communecter/docker/code/pixelhumain/ph/assets/*