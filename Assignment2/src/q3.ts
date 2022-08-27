import {  Binding, CExp, Exp, isAppExp, isAtomicExp, isBoolExp, isDefineExp, isExp, isIfExp, isLetExp, isLetPlusExp, isLitExp, isNumExp, isPrimOp, isProgram, isVarRef, LetExp, LetPlusExp, makeAppExp, makeBinding, makeDefineExp, makeIfExp, makeLetExp, makeProgram, Program } from "./L31-ast";
import { Result, makeFailure, bind, mapResult, makeOk, safe2 } from "../shared/result";
import { isEmpty, map, zipWith } from "ramda";
import { rest } from "../shared/list";


/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
isProgram(exp) ? bind(mapResult(L31ExpFromToL3, exp.exps), (exps: Exp[]) => makeOk(makeProgram(exps))) :
isExp(exp) ? L31ExpFromToL3(exp) :
makeFailure("Never");

/*
Purpose: Transform L31 exp to L3 exp
Signature: l31ToL3(l31exp)
Type: [Exp] => Result<Exp>
*/
export const L31ExpFromToL3= (exp: Exp): Result<Exp> =>
    isDefineExp(exp) ? bind(buildCExp(exp.val), (val: CExp) => makeOk(makeDefineExp(exp.var, val))) :
    buildCExp(exp)

/*
Purpose: Transform L31 CExp to L3 CExp
Signature: l31ToL3(l31CExp)
Type: [CExp] => Result<CExp>
*/
export const buildCExp = (exp: CExp): Result<CExp> =>
    isAtomicExp(exp) ? makeOk(exp):
    isLitExp(exp) ? makeOk(exp) :
    isAppExp(exp) ?  safe2((parm: CExp, array: CExp[]) => makeOk(makeAppExp(parm, array)))
        (buildCExp(exp.rator), mapResult(buildCExp, exp.rands)) :
    isLetExp(exp) ?  safe2((vals : CExp[], body: CExp[]) => makeOk(makeLetExp(zipWith(makeBinding,map(binding => binding.var.var, exp.bindings), vals), body)))
        (mapResult((binding : Binding ) => buildCExp(binding.val), exp.bindings), mapResult(buildCExp,exp.body)):
    isIfExp(exp) ? ifexpFun((test: CExp, then: CExp, alt: CExp) => makeOk(makeIfExp(test, then, alt)))
        (buildCExp(exp.test), buildCExp(exp.then), buildCExp(exp.alt)) :
    isLetPlusExp(exp) ? bind(letPlusToLet(exp),buildCExp) :
    makeFailure(`not CExp: ${exp.tag}`)


/*
Purpose: Transform Let* to let
Signature: letPlusToLet(LetPlusExp)
Type: [LetPlusExp] =>Result<LetExp>
*/

export const letPlusToLet=(exp:LetPlusExp): Result<LetExp> =>
    makeOk(makeLetExp([exp.bindings[0]],buildLetExp(rest(exp.bindings),exp.body)))


/*
Purpose: return a body like let
Signature:buildLetExp(bind,body)
Type: [bind:Binding[],body: CExp[]] =>CExp[]|LetExp[]
*/
const buildLetExp=(bind:Binding[],body: CExp[]): CExp[]| LetExp[]=> 
    isEmpty(bind)? body :
    isEmpty(rest(bind))? [makeLetExp(bind,body)]  :
    buildLetExp(rest(bind),body) 


const ifexpFun =  <T1, T2, T3, T4>(f: (x: T1, y: T2, z: T3) => Result<T4>): (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => Result<T4> =>
    (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => bind(xr, (x: T1) => bind(yr, (y: T2) => bind(zr, (z: T3) => f(x, y, z))))



