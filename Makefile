build : out/main.js assets

assets : out/assets/.makeflag

out/main.js : $(wildcard src/*) $(wildcard src/states/*)
	tsc --project tsconfig.json
	cp src/index.html out

out/assets/.makeflag : $(wildcard assets/audio/* assets/textures/*)
	rm --recursive --force out/assets
	mkdir -p out/assets
	cp -r assets/* out/assets
	touch out/assets/.makeflag

serve : build
	python -m http.server --directory out

release.zip : build
	zip -u release.zip out

clean :
	rm -r out
