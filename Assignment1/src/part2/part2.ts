import * as R from 'ramda';

const stringToArray = R.split("");


/* Question 1 */
export const countLetters: (s: string) =>{}= R.pipe(
    R.toLower,
    stringToArray,
    R.filter((x:string)=>((x>='A'&&x<='Z')||(x>='a'&&x<='z'))),
    R.countBy(R.toLower)
);
/* Question 2 */
const eqauls=(stack:string[],temp:string):string[]=>
    temp==='['||temp==='{'||temp==='(' ?R.prepend(temp,stack):
    R.isEmpty(stack)&&(temp===')'||temp===']'||temp==='}'||temp==='('||temp==='['||temp==='{')?[temp]:
    (R.head(stack)==='('&&temp===')')||(R.head(stack)==='['&&temp===']')||(R.head(stack)==='{'&&temp==='}')?R.tail(stack)
    :temp===')'||temp===']'||temp==='}'?R.prepend(temp,stack):stack
export const isPaired: (s: string) => boolean = R.pipe(
    stringToArray,
    R.reduce(eqauls,[]),
    R.isEmpty
    );
/* Question 3 */
export interface WordTree {
    root: string;
    children: WordTree[];
}
export const print=(root:string,temp:WordTree,index:number,childrenArray:WordTree[]):string=>
    childrenArray.length===0?root:root+" "+treeToSentence(temp)

export const treeToSentence = (t: WordTree): string =>
    t.children.reduce(print,t.root)

