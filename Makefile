TESTS = $$(find test -name "*.js")

test:
	mocha --reporter spec $(TESTS)
.PHONY: test
