# Yflow

  Generator based flow-control goodness for nodejs (and soon the browser), using
  thunks, letting you write non-blocking code in a nice-ish
  way.

  Currently you must use the `--harmony-generators` flag when
  running node 0.11.x to get access to generators.

  Co is careful to relay any errors that occur back to the generator, including those
  within the thunk, or from the thunk's callback. "Uncaught" exceptions in the generator
  are passed to `yflows thunk.
 
## Installation

```
$ npm install yflow
```


## Example 1

```js
var yflow = require('yflow');
function netGet(url, cb) {
	setTimeout(function () {
		cb(null, "response from url:" + url)
	}, 500);
}
var net={
   get:netGet,
   post:netGet
}
var ynet=yflow.wrap(net);

yflow(function  * () {	
	var ret = yield ynet.get("google.com");
	console.log("ret is :" +ret);
	console.log("sleep one second");
	yield yflow.sleep(1000);
	console.log("I'm awake!");
	// run in parallel
	var p = yield[ ynet.post("f1"), ynet.post("f2"), ynet.post("f4")];
	console.log(p);
})(function (e) {
	if(!e){
	   console.log("OK!");
	}else{
	   console.log(e.stack);
	}
});

```
## Example 2

```js
function netGet(url, cb) {
	setTimeout(function () {
		cb(null, "response from url:" + url)
	}, 500);
}
yflow(function  * () {	
    var wrapper=yflow.wrap(netGet)
	var ret = yield wrapper("baidu.com");
	console.log("ret is :" +ret);
	console.log("sleep one second");
	yield yflow.sleep(1000);
	console.log("I'm awake!");	
	// run in parallel
	var p = yield[ wrapper("f4"), wrapper("f5"), wrapper("f6")];
	console.log(p);
})(function (e) {
	if(!e){
	   console.log("OK!");
	}else{
	   console.log(e.stack);
	}
});
```

## License

  MIT

