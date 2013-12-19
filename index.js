var slice = Array.prototype.slice;
module.exports = yflow;
function yflow(fn) {
	var doneFn = function () {};
	var ctx = this,
	genFn,
	ret;
	function next(err, res) {
		// multiple args
		if (arguments.length > 2) {
			res = slice.call(arguments, 1);
		}

		// error
		if (err) {
			try {
				ret = genFn.throw(err);
			} catch (e) {
				return doneFn(e);
			}
		}
		// ok
		if (!err) {
			try {
				var isRun = false;
				if (genFn.send) {
					isRun = true;
					ret = genFn.send(res || null);
				}
				if (!isRun) {
					ret = genFn.next(res);
				}

			} catch (e) {
				return doneFn(e);
			}
		}
		// done
		if (ret.done) {
			return doneFn(null, ret.value);
		}

		ret.value = yflow.toThunk(ret.value, ctx);

		// run
		if ('function' == typeof ret.value) {
			var called = false;
			try {
				ret.value.call(ctx, function () {
					if (called)
						return;
					called = true;
					next.apply(ctx, arguments);
				});
			} catch (e) {
				setImmediate(function () {
					if (called)
						return;
					called = true;
					next(e);
				});
			}
			return;
		}
		// invalid
		next(new Error('yield a function plese!'));
	}

	return function (_done) {
		doneFn = _done || doneFn;
		genFn = fn.call(ctx);
		next();
	}
}

yflow.sleep = function (time) {
	return function (fn) {
		setTimeout(fn, time || 100);
	}
}
function wrapFunction(fn, ctx) {
	return function () {
		var args = slice.call(arguments, 0);
		return function (callback) {
			args.push(callback);
			fn.apply(ctx || {}, args);
		}
	}
}
yflow.wrap = function (obj) {
	if (typeof obj == 'function') {
		return wrapFunction.apply(null, arguments);
	} else {
		var wrapper = {};
		for (var p in obj) {
			if (obj.hasOwnProperty(p)) {
				if (typeof obj[p] == 'function') {
					wrapper[p] = wrapFunction(obj[p], obj);
				}
			}
		}
		return wrapper;
	}
}
yflow.toThunk = function (obj) {
	if (Array.isArray(obj)) {
		return yflow.arrayToThunk(obj);
	}
	return obj;
}
yflow.arrayToThunk = function (fns) {
	var ctx = this;
	return function (done) {
		var pending = fns.length;
		var results = new Array(pending);
		var finished;
		if (!pending) {
			setImmediate(function () {
				done(null, results);
			});
			return;
		}

		for (var i = 0; i < fns.length; i++) {
			run(fns[i], i);
		}
		function run(fn, i) {
			if (finished)
				return;
			try {
				fn.call(ctx, function (err, res) {
					if (finished)
						return;

					if (err) {
						finished = true;
						return done(err);
					}

					results[i] = res;
					--pending || done(null, results);
				});
			} catch (err) {
				finished = true;
				done(err);
			}

		}
	}
};
