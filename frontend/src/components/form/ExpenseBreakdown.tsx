import React, { useState } from 'react';
import FormSection from './FormSection';
import { Plus, Trash2, Upload } from 'lucide-react';

interface ExpenseBreakdownProps {
  data: any;
  updateData: (section: string, data: any) => void;
}

interface Expense {
  id: string;
  billNo: string;
  date: string;
  description: string;
  amountClaimed: number;
  amountPassed: number;
  category: string;
}

const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({ data, updateData }) => {
  const [expenses, setExpenses] = useState<Expense[]>(data.expenses || [{
    id: '1',
    billNo: '',
    date: '',
    description: '',
    amountClaimed: 0,
    amountPassed: 0,
    category: 'OPD'
  }]);

  const addExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      billNo: '',
      date: '',
      description: '',
      amountClaimed: 0,
      amountPassed: 0,
      category: 'OPD'
    };
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    updateData('expenses', updatedExpenses);
  };

  const removeExpense = (id: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    updateData('expenses', updatedExpenses);
  };

  const updateExpense = (id: string, field: keyof Expense, value: string | number) => {
    const updatedExpenses = expenses.map(expense =>
      expense.id === id ? { ...expense, [field]: value } : expense
    );
    setExpenses(updatedExpenses);
    updateData('expenses', updatedExpenses);
  };

  const getTotalAmount = () => {
    return expenses.reduce((total, expense) => total + (expense.amountClaimed || 0), 0);
  };

  return (
    <FormSection title="Expense Breakdown" subtitle="व्यय विवरण">
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                  Bill No.<br />
                  <span className="text-xs text-gray-500">बिल नंबर</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                  Date<br />
                  <span className="text-xs text-gray-500">दिनांक</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                  Description<br />
                  <span className="text-xs text-gray-500">विवरण</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                  Category<br />
                  <span className="text-xs text-gray-500">श्रेणी</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                  Amount Claimed<br />
                  <span className="text-xs text-gray-500">दावा राशि</span>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr key={expense.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 border-b">
                    <input
                      type="text"
                      value={expense.billNo}
                      onChange={(e) => updateExpense(expense.id, 'billNo', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 border-b">
                    <input
                      type="date"
                      value={expense.date}
                      onChange={(e) => updateExpense(expense.id, 'date', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 border-b">
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Treatment details"
                    />
                  </td>
                  <td className="px-4 py-3 border-b">
                    <select
                      value={expense.category}
                      onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="OPD">OPD Treatment</option>
                      <option value="IPD">In-patient Treatment</option>
                      <option value="Tests">Tests/Investigations</option>
                      <option value="Advance">Advance Taken</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <input
                      type="number"
                      value={expense.amountClaimed}
                      onChange={(e) => updateExpense(expense.id, 'amountClaimed', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3 border-b text-center">
                    <button
                      type="button"
                      onClick={() => removeExpense(expense.id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={expenses.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-medium text-right border-t">
                  Total Amount / कुल राशि:
                </td>
                <td className="px-4 py-3 font-bold text-blue-800 border-t">
                  ₹ {getTotalAmount().toFixed(2)}
                </td>
                <td className="px-4 py-3 border-t"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button
          type="button"
          onClick={addExpense}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Expense</span>
        </button>
      </div>
    </FormSection>
  );
};

export default ExpenseBreakdown;