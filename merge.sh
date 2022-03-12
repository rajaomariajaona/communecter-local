cp venn.js /home/snowden/dev/communecter/modules/graph/assets/js/venn.js
cd library/dist/js
python3 merge.py
npx babel all.js --out-file all-babel.js
cp all.js /home/snowden/dev/communecter/modules/graph/assets/js/graph-src.js
cp all-babel.js /home/snowden/dev/communecter/modules/graph/assets/js/graph.js
cd ../css
cp graph.css /home/snowden/dev/communecter/modules/graph/assets/css/graph.css
rm -rf /home/snowden/dev/communecter/pixelhumain/ph/assets/*