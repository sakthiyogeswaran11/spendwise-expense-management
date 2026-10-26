export function budgetStatus(spent,limit){const used=limit>0?spent/limit*100:0;return{used,remaining:Math.max(0,limit-spent),level:used>=100?'exceeded':used>=90?'high':used>=70?'warning':'normal'}}
export function sumMoney(values){return values.reduce((total,value)=>total+Math.round(Number(value)*100),0)/100}
