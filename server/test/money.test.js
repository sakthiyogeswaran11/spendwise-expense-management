import test from'node:test';import assert from'node:assert/strict';import{budgetStatus,sumMoney}from'../src/money.js';
test('budget thresholds classify normal, warning, high and exceeded',()=>{assert.equal(budgetStatus(50,100).level,'normal');assert.equal(budgetStatus(70,100).level,'warning');assert.equal(budgetStatus(90,100).level,'high');assert.equal(budgetStatus(100,100).level,'exceeded')});
test('remaining does not become negative after budget is exceeded',()=>{assert.equal(budgetStatus(125,100).remaining,0)});
test('money summation uses cents to avoid binary floating point drift',()=>{assert.equal(sumMoney([0.1,0.2,0.7]),1)});
