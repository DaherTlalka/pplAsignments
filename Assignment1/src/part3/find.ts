import { Result, makeFailure, makeOk, bind, either, isFailure } from "../lib/result";

/* Library code */
const findOrThrow = <T>(pred: (x: T) => boolean, a: T[]): T => {
    for (let i = 0; i < a.length; i++) {
        if (pred(a[i])) return a[i];
    }
    throw "No element found.";
}

export const findResult = <T>(pred: (x: T) => boolean, arr: T[]): Result<T>=>
   arr.reduce((curr:Result<any>,elem)=>
    isFailure(curr)&&pred(elem)?
    makeOk(elem):curr,makeFailure("No element found."))

/* Client code */
const returnSquaredIfFoundEven_v1 = (a: number[]): number => {
    try {
        const x = findOrThrow(x => x % 2 === 0, a);
        return x * x;
    } catch (e) {
        return -1;
    }
}
export const returnSquaredIfFoundEven_v2 =(arr: any[]): Result<any>=>
    bind(findResult(x=>x%2===0,arr),x=>makeOk(x*x))

export const returnSquaredIfFoundEven_v3 =(arr: any[]): number=>    
   either(findResult(x=>x%2===0,arr),(x:number):number=>x*x,(x:string):number=>-1)


console.log(returnSquaredIfFoundEven_v3([1, 3, 5]));