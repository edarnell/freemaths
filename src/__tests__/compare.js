
import { test, outTree, commute, compare, compare_eval } from '../compare'
import { expression } from '../expression'
//import {set_debug} from '../Utils'

describe('compare', function () {
	it("compare('x','x',null)", function () {
		expect(compare("x", "x", null)).toEqual(true)
	})

	it("compare('x','x+0')", function () {
		expect(compare("x", "x+0", null)).toEqual(true)
	})
	it("compare('y+x','x+0+y')", function () {
		expect(compare("y+x", "x+0+y", null)).toEqual(true)
	})

	it("commute", function () {
		let tree = expression("1-2+3-4+5");
		expect(outTree(commute(tree, 0))).toEqual('1-2+3+5-4');
		expect(outTree(commute(tree, 1))).toEqual('1-2+5-4+3');
		expect(outTree(commute(tree, 2))).toEqual('1+5+3-4-2');
		expect(outTree(commute(tree, 3))).toEqual('5-2+3-4+1');
		expect(outTree(commute(tree, 4))).toEqual(false);
	})
	it("commute 2", function () {
		let tree = expression("-1+2-3+4-5");
		expect(outTree(commute(tree, 0))).toEqual('-1+2-3-5+4');
		expect(outTree(commute(tree, 1))).toEqual('-1+2-5+4-3');
		expect(outTree(commute(tree, 2))).toEqual('-1-5-3+4+2');
		expect(outTree(commute(tree, 3))).toEqual('-5+2-3+4-1');
		expect(outTree(commute(tree, 4))).toEqual(false);
	})
	it("commute 3", function () {
		var tree = expression("{-3}x-16");
		expect(outTree(commute(tree, 0))).toEqual('-16-3x');
	})

	it("multiply", function () {
		let tree = expression("xyz");
		expect(test.compare_tree(tree, expression("xyz"))).toEqual(true);
		expect(test.compare_tree(tree, expression("x*y*z"))).toEqual(true);
		expect(test.compare_tree(tree, expression("y*x*z"))).toEqual(true);
		expect(test.compare_tree(tree, expression("y*z*x"))).toEqual(true);
		expect(test.compare_tree(tree, expression("z*x*y"))).toEqual(true);
		expect(test.compare_tree(tree, expression("(z*y)*x"))).toEqual(true);
		expect(test.compare_tree(tree, expression("zyx"))).toEqual(true);
		expect(test.compare_tree(tree, expression("yx(z)"))).toEqual(true);
		expect(test.compare_tree(tree, expression("z(y)x"))).toEqual(true);
	})

	it("add", function () {
		let tree = expression("x+y+z");
		expect(test.compare_tree(tree, expression("x+y+z"))).toEqual(true);
		expect(test.compare_tree(tree, expression("x+y+z"))).toEqual(true);
		expect(test.compare_tree(tree, expression("x+z+y"))).toEqual(true);
		expect(test.compare_tree(tree, expression("y+x+z"))).toEqual(true);
		expect(test.compare_tree(tree, expression("y+z+x"))).toEqual(true);
		expect(test.compare_tree(tree, expression("z+x+y"))).toEqual(true);
		expect(test.compare_tree(tree, expression("z+y+x"))).toEqual(true);
	})

	it("subtract", function () {
		expect(compare("-y+x", "x-y")).toEqual(true);
		expect(compare("-x-y", "-y-x")).toEqual(true);
		expect(compare("-y+x", "y-x")).toEqual(false);
		expect(compare("x+y+z-x+y+z", "x-x+y+z+y+z")).toEqual(true);
		expect(compare("x+y+z-x+y+z", "-x+x+y+z+y+z")).toEqual(true);
		expect(compare("x+y+z-x+y+z", "x+x+y+z+y+z")).toEqual(false);
		expect(compare("x+y+z+x+y-z", "-z+x+x+y+z+y")).toEqual(true);
	})


	it("divide", function () {
		// allows double decker fractions - but mark should give ?tick
		expect(compare("3/5", "5/3")).toEqual(false)
		//set_debug('compare','normalise')
		expect(compare("3/5/7", "3/7/5")).toEqual(true) //now allowed
		expect(compare("3/5*6/7", "6/7*3/5")).toEqual(true)
		expect(compare("3/5*6/7", "3/7*6/5")).toEqual(true)
		expect(compare("3/5/6*7/8", "3/5*7/6/8")).toEqual(true) //now allowed
	})

	it("negatives", function () {
		expect(compare("-(2+1)", '-2+1')).toEqual(false);
	})
	it("negatives 2", function () {
		//set_debug('compare')
		expect(compare("-2", '-(2)')).toEqual(true);
	})
	it("negatives 3", function () {
		expect(compare("-2/3", '-(2/3)')).toEqual(true);
	})
	it("negatives 4", function () {
		expect(compare("-2/3", '-(2)/3')).toEqual(true);
	});
	it("negatives 5", function () {
		expect(compare("-(2+3)/3", '-((2+3)/3)')).toEqual(true);
	});
	it("negatives 6", function () {
		expect(compare("-((2lnx+1)/(4x^2))+c", "-(2lnx+1)/(4x^2)+c", null, { xyz: "x c" })).toEqual(true);
	})
	it("mixed 1", function () {
		//set_debug('expression','compare')
		expect(compare("3(x+sin2x)^2", "(3(sin(x*2)+x)^2)")).toEqual(true);
	})
	it("mixed 2", function () {
		//set_debug('expression')
		expect(compare("2cos2x", "2*cos(x*2)")).toEqual(true);
	})
	it("mixed 3", function () {
		expect(compare("2cos2x", "cos(x*2)*2")).toEqual(true);
	})
	it("mixed 4", function () {
		expect(compare("3(x+sin2x)^2(1+2cos2x)", "(cos(x*2)*2+1)*3(sin(x*2)+x)^2")).toEqual(true);
	})
	it("compare x(1-2x)(1+2x)", function () {
		expect(compare("x(1-2x)(1+2x)", "x(1+2x)(1-2x)")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "x(2x+1)(-2x+1)")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "x(-2x+1)(2x+1)")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "x(1-2x)(2x+1)")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "x(2x+1)(1-2x)")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "(1-2x)(1+2x)x")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "(1+2x)(1-2x)x")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "(2x+1)(-2x+1)x")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "(-2x+1)(2x+1)x")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "(1-2x)(2x+1)x")).toEqual(true)
		expect(compare("x(1-2x)(1+2x)", "(2x+1)(1-2x)x")).toEqual(true)
		expect(compare("x(1-5x)(1+5x)", "(5x+1)(-5x+1)x")).toEqual(true)
	})

	it("C1_16", function () {
		expect(compare("8-x^4/4-2/x+5/4*x^2", '5/4*x^2-x^4/4-2/x+8')).toEqual(true)
	})

	it("normalise", function () {
		//expect(output_tree(test.normalise(expression("2/3*x")))).toEqual(2*x/3');
		expect(outTree(test.normalise(expression("2/3*x")))).toEqual('2*x/3')
	})

	it("normalise eqn", function () {
		expect(outTree(test.normalise(expression("y=2/3*x")))).toEqual('y=2*x/3')
	})

	it("normalise root", function () {
		expect(outTree(test.normalise(expression("1/√x")))).toEqual("1/x^(1/2)")
	})

	it("normalise power", function () {
		expect(outTree(test.normalise(expression("x^-1")))).toEqual("1/x")
	})

	it("normalise  power_root", function () {
		expect(outTree(test.normalise(expression("3x^(-1/2)")))).toEqual("3/x^(1/2)")
	})

	it("normalise  power_root2", function () {
		expect(outTree(test.normalise(expression("3/√x")))).toEqual("3/x^(1/2)")
	})

	it("normalise  power", function () {
		expect(compare("3x^(-1/2)", "3/√x")).toEqual(true)
	})

	it("normalise  reciprocal", function () {
		expect(compare("x^-1", "1/x")).toEqual(true)
	})

	it("itC4_2a", function () {
		expect(compare("-(2lnx+1)/(4x^2)+c", '-((2lnx+1)/(4x^2))+c', null, { xyz: 'x c' })).toEqual(true);
	});

	it("itGCSE_2H_2013_March_11c", function () {
		expect(compare("(-3x+2y)3y", '3y(2y-3x)')).toEqual(true);
		expect(compare("3y(2y-3x)", '(-3x+2y)3y')).toEqual(true);
	})

	it("4±√7", function () {
		expect(compare("4±√7", '4±√7')).toEqual(true);
	})

	it("4±√7 v", function () {
		expect(compare("{b}±√{c}", '4±√7', null, { _v_: { b: 4, c: 7 } })).toEqual(true);
	})

	it("5±√17", function () {
		expect(compare_eval("{b}±√{b^2-c}", '5±√17', null, { _v_: { b: 5, c: 8 } })).toEqual(true);
	})

	it("5±√17,", function () {
		expect(compare_eval("{b}±√{b^2-c}", '5±√17', ',', { _v_: { b: 5, c: 8 } })).toEqual(true);
	})

	it("5±√17 +-", function () {
		expect(compare_eval("{b}±√{b^2-c}", '5+√17,5-√17', ",", { _v_: { b: 5, c: 8 } })).toEqual(true);
	})

	it("5±√17 -+", function () {
		expect(compare_eval("{b}±√{b^2-c}", '5-√17,5+√17', ",", { _v_: { b: 5, c: 8 } })).toEqual(true);
	})

	it("4/3 {4/3}", function () {
		expect(compare("{(1-3/7)/(3/7)}", '4/3')).toEqual(true);
	})

	it("4/3 {(1-f)/f}", function () {
		//set_debug("compare")
		expect(compare("{(1-f)/f}", '4/3', null, { _v_: { f: '3/7' } })).toEqual(true);
	})

	it("-x/2 -1/2x", function () {
		expect(compare('-x/2', '-1/2x')).toEqual(true)
	})

	it("-x/2 {-1/2}x", function () {
		//set_debug("normalise")
		expect(compare('-x/2', '{-1/2}x')).toEqual(true)
	})

	it("-x/2-1/2 {-1/2}x-1/2", function () {
		expect(compare('-x/2-1/2', '{-1/2}x-1/2')).toEqual(true)
	})

	it("-0.5x {-1/2}x", function () {
		expect(compare('-0.5x', '{-1/2}x')).toEqual(true)
	})

	it(".5x {1/2}x", function () {
		expect(compare('.5x', '{1/2}x')).toEqual(true)
	})

	it("3.5x {7/2}x", function () {
		expect(compare('3.5x', '{7/2}x')).toEqual(true)
	})
	it("0.5 1/2", function () {
		expect(compare('0.5', '1/2')).toEqual(false)
	})
	it("0.5 1/2 #", function () {
		expect(compare('0.5', '1/2', '#')).toEqual(true)
	})
	it("mixed", function () {
		expect(compare('1˽2/7', '{9/7#mixed}')).toEqual(true)
	})
	it("mixed ?", function () {
		expect(compare('9/7', '{9/7#mixed}')).toEqual(false)
	})
	it("mixed #", function () {
		expect(compare('9/7', '{9/7#mixed}', '#')).toEqual(true)
	})
})
