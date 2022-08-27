import { call, fromPairs, map, reject, T } from "ramda";

export const MISSING_KEY = '___MISSING_KEY___'
export const MISSING_TABLE_SERVICE = '___MISSING_TABLE_SERVICE___'

export type Table<T> = Readonly<Record<string, Readonly<T>>>

export type TableService<T> = {
    get(key: string): Promise<T>;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
}

// Q 2.1 (a)
export function makeTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>): TableService<T> {
    // optional initialization code
    return {
        get(key: string): Promise<T> {
            return new Promise((resolve,reject)=>{
                sync().then((tabel:Table<T>)=>{
                    var f:Boolean=false;
                    for(var i in tabel){
                        if(i === key){
                            resolve(tabel[i]);
                            f=true;
                            break;
                        }
                    }
                    if(f===false){
                        reject(MISSING_KEY);
                    }
                }).catch(err=>reject(err));
            })
        },
        set(key: string, val: T): Promise<void> {
            return new Promise((resolve,reject)=>{
                sync().then((tabel:Table<T>)=>{
                    let temp:Record<string,T>={};
                    temp[key]=val;
                    for(var i in tabel){
                        if(i!==key)
                            temp[i]=tabel[i];
                    }
                    sync(temp).catch(err=>reject(err))
                    resolve();
                }).catch(err=>reject(err))
            })
        },
        delete(key: string): Promise<void> {
            return new Promise((resolve,reject)=>{
                sync().then((tabel:Table<T>)=>{
                    let temp:Record<string,T>={}
                    let f:boolean=false;
                    for(var i in tabel){
                        if(i===key)
                            f=true
                        else{
                            temp[i]=tabel[i];
                        }
                    }
                    if(!f) reject(MISSING_KEY)
                    else{
                    sync(temp).catch((err)=>reject(err))
                    resolve();
                    }
                }).catch(err=>reject(err))
            })
        }
    }
}

// Q 2.1 (b)
export function getAll<T>(store: TableService<T>, keys: string[]): Promise<T[]> {
     let res= map((key:string)=>store.get(key),keys);
     return Promise.all(res);
}


// Q 2.2
export type Reference = { table: string, key: string }

export type TableServiceTable = Table<TableService<object>>

export function isReference<T>(obj: T | Reference): obj is Reference {
    return typeof obj === 'object' && 'table' in (obj as Reference)
}

export async function constructObjectFromTables(tables: TableServiceTable, ref: Reference) {
    async function deref(ref: Reference) {
        if(ref.table in tables){
            let tab=Object.entries(await tables[ref.table].get(ref.key));
            for( var [Key,value] of tab)  {
                if(isReference(value)){
                let newtab=tab.filter((arr)=>arr[0]!==Key)
                let addtab:[string,any]=[Key,await deref(value)]
                newtab.push(addtab)
                return Object.fromEntries(newtab);
                }
            }
            return  Promise.resolve(tables[ref.table].get(ref.key))
        }
        else{
            return Promise.reject(MISSING_TABLE_SERVICE);
        
        }// }
    }

    return deref(ref)
}

// Q 2.3

export function lazyProduct<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        for(let val of g1()){
            for(let val1 of g2()){
                yield [val,val1];
            }
        }
    }
}

export function lazyZip<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        let tempg1=g1();
        let tempg2=g2();
        var valueg1=tempg1.next().value;
        var valueg2=tempg2.next().value;
        while(valueg1!==undefined && valueg2!==undefined){
            yield [valueg1,valueg2]
            valueg1=tempg1.next().value;
            valueg2=tempg2.next().value;
        }
    }
}

// Q 2.4
export type ReactiveTableService<T> = {
    get(key: string): T;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
    subscribe(observer: (table: Table<T>) => void): void
}

export async function makeReactiveTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>, optimistic: boolean): Promise<ReactiveTableService<T>> {
    // optional initialization code

    let _table: Table<T> = await sync()
    let OBArr : CallableFunction[] = [];
    let teb:Table<T>[]=[_table];
    const handleMutation = async (newTable: Table<T>) => {
        if(optimistic){
            teb[0]=newTable
            map((ta:Table<T>)=>{
                for(let c of OBArr){
                    c(ta);
                }
            },teb)
            teb[0]=_table
            await sync(newTable).
            then(t => _table = t).
            catch(_ => {
                map((ta:Table<T>)=>{
                    for(let c of OBArr){
                        c(ta);
                    }
                },teb)
                return Promise.reject(_);
            });
        }else{
            _table = await sync(newTable);
            teb[0]=newTable;
            map((ta:Table<T>)=>{
                for(let c of OBArr){
                    c(ta);
                }
            },teb)
        }
        return Promise.resolve();
    }
    return {
        get(key: string): T {
            if (key in _table) {
                return _table[key]
            } else {
                throw MISSING_KEY
            }
        },
        set(key: string, val: T): Promise<void> {
            let temp : Record<string,T> = {};
            temp[key] = val;
            for(var k in _table){
                if(k !== key)
                    temp[k] = _table[k];
            }
            return handleMutation(temp);
        },
        delete(key: string): Promise<void> {
            if(!(key in _table)){
                return Promise.reject(MISSING_KEY);
            }
            let newTable : Record<string,T> = {};
            for(var k in _table){
                if(k !== key)
                    newTable[k] = _table[k];
            }
            return handleMutation(newTable);
        },

        subscribe(observer: (table: Table<T>) => void): void {
            OBArr.push(observer);
        }
    }
}


