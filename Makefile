prefix = /usr/local

build:
	npm install --registry http://registry.npmjs.org

install-dirs:
	mkdir -p $(DESTDIR)$(prefix)/lib/node_modules/opinsys-sso-proxy

clean-for-install:
	npm prune

install: clean-for-install install-dirs
	cp -a \
	*.js \
	*.json \
	views \
	node_modules \
    $(DESTDIR)$(prefix)/lib/node_modules/opinsys-sso-proxy

clean:
	rm -rf node_modules

clean-deb:
	rm -f ../opinsys-sso-proxy*.dsc
	rm -f ../opinsys-sso-proxy*.deb
	rm -f ../opinsys-sso-proxy*.changes
	rm -f ../opinsys-sso-proxy*.tar.gz
