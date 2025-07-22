
import { DataFrame } from './dist/index'; // Adjust the path if DataFrame is in a different location


// --- Example Usage ---
console.log("--- js-dataframes Prototype Example Usage ---");

// 1. Create a DataFrame from an array of objects
const data1 = [
    { name: 'Alice', age: 30, city: 'New York' },
    { name: 'Bob', age: 24, city: 'London' },
    { name: 'Charlie', age: null, city: 'Paris' },
    { name: 'David', age: 30, city: 'New York' },
    { name: 'Eve', age: 24, city: 'London' },
];
const df1 = new DataFrame(data1);
console.log("\nDataFrame df1 (from array of objects):");
console.log(df1.toString());

// 2. Create a DataFrame from an object of arrays (columnar)
const data2 = {
    product: ['Apple', 'Banana', 'Orange', 'Apple'],
    price: [1.0, 0.5, 0.75, 1.2],
    quantity: [100, 200, null, 150]
};
const df2 = new DataFrame(data2, { index: ['a', 'b', 'c', 'd'] });
console.log("\nDataFrame df2 (from object of arrays with custom index):");
console.log(df2.toString());

// 3. Basic Selection with .loc
console.log("\nSelecting rows 'b' and 'd' and columns 'product', 'price' from df2 using .loc:");
const selectedDf2_loc = df2.loc(['b', 'd'], ['product', 'price']);
console.log(selectedDf2_loc.toString());

// 4. Basic Selection with .iloc
console.log("\nSelecting rows at positions 0 and 2 and column at position 1 from df2 using .iloc:");
const selectedDf2_iloc = df2.iloc([0, 2], 1); // Selects 'price' column for rows 0 and 2
console.log(selectedDf2_iloc.toString());

// 5. Boolean Indexing with .loc
console.log("\nSelecting rows from df1 where age is 30 using boolean indexing:");
const ageCondition = df1.get('age')?.values.map(age => age === 30) || [];
const filteredDf1 = df1.loc(ageCondition);
console.log(filteredDf1.toString());

// 6. Handling Missing Values with fillna
console.log("\ndf1 after filling null ages with 0:");
const df1_filled = df1.fillna(0);
console.log(df1_filled.toString());

// 7. Handling Missing Values with dropna (rows)
console.log("\ndf1 after dropping rows with null values:");
const df1_dropped_rows = df1.dropna('rows');
console.log(df1_dropped_rows.toString());

// 8. Handling Missing Values with dropna (columns)
console.log("\ndf2 after dropping columns with null values (quantity column should be dropped):");
const df2_dropped_cols = df2.dropna('columns');
console.log(df2_dropped_cols.toString());

// 9. Accessing a single Series
console.log("\nAccessing 'city' Series from df1:");
const citySeries = df1.get('city');
if (citySeries) {
    console.log(citySeries.toString());
}

// 10. Setting a new column
console.log("\ndf1 after adding a new 'isActive' column:");
df1.set('isActive', [true, false, true, false, true]);
console.log(df1.toString());

// --- New Features Demonstration ---

// 11. astype
console.log("\ndf1 'age' column after converting to string type:");
const df1_age_as_string = df1.astype('age', 'string');
console.log(df1_age_as_string.get('age')?.toString());

console.log("\ndf2 'price' column after converting to string type:");
const df2_price_as_string = df2.astype('price', 'string');
console.log(df2_price_as_string.get('price')?.toString());

// 12. drop_duplicates
console.log("\ndf1 after dropping duplicates based on 'age' and 'city':");
const df1_deduplicated = df1.drop_duplicates(['age', 'city']);
console.log(df1_deduplicated.toString());

// 13. concat (rows)
const data3 = [
    { name: 'Frank', age: 28, city: 'Berlin' },
    { name: 'Grace', age: 35, city: 'Rome' }
];
const df3 = new DataFrame(data3);
console.log("\nDataFrame df3:");
console.log(df3.toString());

console.log("\ndf1 after concatenating with df3 (rows):");
const df_concat_rows = df1.concat([df3], 'rows');
console.log(df_concat_rows.toString());

// 14. concat (columns)
const data4 = {
    email: ['alice@example.com', 'bob@example.com', 'charlie@example.com', 'david@example.com', 'eve@example.com'],
    status: ['active', 'inactive', 'active', 'active', 'inactive']
};
const df4 = new DataFrame(data4, { index: df1.index }); // Assume same index for column concat
console.log("\nDataFrame df4:");
console.log(df4.toString());

console.log("\ndf1 after concatenating with df4 (columns):");
const df_concat_cols = df1.concat([df4], 'columns');
console.log(df_concat_cols.toString());

// 15. merge (inner join)
const ordersData = [
    { name: 'Alice', orderId: 'ORD001', amount: 120 },
    { name: 'Bob', orderId: 'ORD002', amount: 50 },
    { name: 'Alice', orderId: 'ORD003', amount: 200 },
    { name: 'Frank', orderId: 'ORD004', amount: 75 } // Frank is not in df1
];
const df_orders = new DataFrame(ordersData);
console.log("\nDataFrame df_orders:");
console.log(df_orders.toString());

console.log("\ndf1 merged with df_orders on 'name' (inner join):");
const df_merged = df1.merge(df_orders, 'name');
console.log(df_merged.toString());

// 16. readCsv and toCsv
const sampleCsv = `id,name,value
1,Alpha,100
2,Beta,200
3,Gamma,300`;

console.log("\nDataFrame created from CSV string:");
const df_from_csv = DataFrame.readCsv(sampleCsv);
console.log(df_from_csv.toString());

console.log("\nDataFrame df_from_csv converted back to CSV string:");
const csvOutput = df_from_csv.toCsv();
console.log(csvOutput);

// 17. Groupby placeholder
console.log("\nCalling groupby on df1 (still a placeholder):");
df1.groupby('city'); // This will still just log a warning for now
console.log("Groupby functionality is a placeholder and not yet implemented.");