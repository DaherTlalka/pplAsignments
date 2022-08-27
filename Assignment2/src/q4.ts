import { map } from 'ramda';
import { Exp, Program, isProgram, isBoolExp, isNumExp, isVarRef, isPrimOp, isProcExp, isIfExp, isAppExp, isDefineExp, PrimOp, CExp, isLetExp, LitExp, isStrExp, isLitExp, Binding, isAtomicExp } from '../imp/L3-ast';
import { isSymbolSExp } from '../imp/L3-value';
import { first } from '../shared/list';
import { Result, makeFailure, mapResult, bind, makeOk, safe2 } from '../shared/result';
import { unparseL31 } from './L31-ast';

/*
Purpose: Transform L3 AST to JavaScript program string
Signature: l30ToJS(exp)
Type: [EXP | Program] => Result<string>
*/
export const l30ToJS = (exp: Exp | Program): Result<string>  => 

    isProgram(exp) ? bind(mapResult(l30ToJS, exp.exps), exps => makeOk(exps.join(";\n"))) :
    isAtomicExp(exp) ? Atomics(exp) :
    isIfExp(exp) ? ifexpFun((test: string, then: string, alt: string) => makeOk(`(${test} ? ${then} : ${alt})`))
        (l30ToJS(exp.test), l30ToJS(exp.then), l30ToJS(exp.alt)) :
    isDefineExp(exp) ? bind(l30ToJS(exp.val), val => makeOk(`const ${exp.var.var} = ${val}`)) :
    isProcExp(exp)  ? bind(l30ToJS(exp.body[exp.body.length-1]), body => makeOk("("+ "("+ 
        map((p) =>p.var, exp.args) + ") => " + body + ")")) :
    isAppExp(exp) ?  
        (
        isPrimOp(exp.rator) ? primOpApp2js(exp.rator, exp.rands) :
        safe2((rator: string, rands: string[]) => makeOk(`${rator}(${rands.join(",")})`))
            (l30ToJS(exp.rator), mapResult(l30ToJS, exp.rands))
        ) :
    isLetExp(exp) ? bind(l30ToJS(exp.body[exp.body.length-1]), body => makeOk("("+ "("+ 
        map((b: Binding) => `${b.var.var}`, exp.bindings).join(",") + ") => " + body + ")"+"("+ map((b: Binding) => `${unparseL31(b.val)}`, exp.bindings).join(",")+")")):
    isLitExp(exp) ? sym(exp) :
    makeFailure("Never") 


const Atomics =(exp:CExp) :Result<string>=>
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isVarRef(exp) ? makeOk(exp.var) :
    isBoolExp(exp) ? exp ? makeOk('#t') :makeOk('#f') :
    isPrimOp(exp) ? makeOk(primop(exp.op)) : 
    isStrExp(exp)? makeOk(`"${exp.val}"`) : 
    makeFailure("Never")  

const primop = (op : string) : string =>
    op === "=" || op === "eq?" ||  op=== "string=?" ? "===" :
    op === "number?" ? "(lambda x : type(x) == int or type (x) == float)" :
    op === "boolean?" ? "(lambda x : type(x) == boolean)" :
    op === "string?" ?"(lambda x : type(x) == string) ": 
    op === "symbol?" ? "((x) => (typeof (x) === symbol))" :
    op=== "not" ? "!":
    op=== "or" ? "|" :
    op=== "and" ? "&" :
    op

const primOpApp2js = (rator : PrimOp, ra : CExp[]) : Result<string> => 
    rator.op === "not" ? bind(l30ToJS(ra[0]), (rand : string) => makeOk("(" +primop(rator.op) + rand + ")")) :
    rator.op === "number?" || rator.op === "boolean?" || rator.op==="string?"  ? bind(l30ToJS(ra[0]), (rand : string) => makeOk(`${primop(rator.op)}(${first(ra)})`)) :
    bind(mapResult(l30ToJS,ra), (rands) => makeOk("(" + rands.join(" " + primop(rator.op) + " ") + ")"));



const sym=(exp: LitExp): Result<string>=> 
    isSymbolSExp(exp.val) ? makeOk(`Symbol.for("${exp.val.val}")`)
    : makeOk(exp.val.toString())

const ifexpFun =  <T1, T2, T3, T4>(f: (x: T1, y: T2, z: T3) => Result<T4>): (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => Result<T4> =>
    (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => bind(xr, (x: T1) => bind(yr, (y: T2) => bind(zr, (z: T3) => f(x, y, z))))
