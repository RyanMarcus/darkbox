babel = node_modules/babel-cli/bin/babel.js
uglify = node_modules/uglify-js/bin/uglifyjs

all: darkbox.min.js 

$(babel) :
	npm install

$(uglify) :
	npm install

darkbox.min.js: $(babel) $(uglify) darkbox.js
	$(babel) darkbox.js | $(uglify) > darkbox.min.js

.phony: all clean

clean:
	rm -f *.min.js
