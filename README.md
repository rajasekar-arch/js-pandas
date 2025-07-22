## js-dataframes

This repository contains a conceptual prototype for a JavaScript/TypeScript DataFrame library, aiming to mimic some core functionalities of Python's widely used Pandas library. This project serves as a foundational blueprint, demonstrating the architectural considerations and initial implementations for handling tabular data in a JavaScript environment.

Disclaimer: This is a prototype and not a full-fledged, production-ready library. Many features are simplified or represented as placeholders, and performance optimizations are largely conceptual at this stage.

> Table of Contents
> 
>     Features
> 
>     Installation (Conceptual)
> 
>     Usage
> 
>         Creating a DataFrame
> 
>         Data Selection
> 
>         Handling Missing Values
> 
>         Accessing and Setting Columns
> 
>         Placeholder Features
> 
>     Core Concepts
> 
>         Series
> 
>         DataFrame
> 
>     Future Enhancements (Roadmap)
> 
>     Contributing
> 
>     License

## Features

This prototype currently offers:

Series Class: Represents a single column of data with an associated index and data type.

DataFrame Class: Represents a tabular data structure with labeled rows and columns.

Data Initialization: Create DataFrames from arrays of objects (row-wise) or objects of arrays (column-wise).

Basic Selection:

loc(): Label-based indexing for selecting rows and columns. Supports single labels, arrays of labels, and boolean arrays for row selection.

iloc(): Position-based indexing for selecting rows and columns by integer positions.

Missing Value Handling:

fillna(): Fills null or undefined values in a Series or DataFrame with a specified value.

dropna(): Removes rows or columns containing null or undefined values.

Column Management: get() to retrieve a Series by column name and set() to add or update columns.

String Representation: toString() methods for both Series and DataFrame for basic console output.

## Installation (Conceptual)

As this is a prototype, there's no official npm package yet. You would typically copy the Series.ts and DataFrame.ts files (or their compiled JavaScript versions) directly into your project.

# Example (if it were a real package)

npm install js-dataframes # This command does not work currently

# or

yarn add js-dataframes # This command does not work currently

## Usage

Here's how you can use the Series and DataFrame classes from this prototype.

```javascript
Creating a DataFrame
import { DataFrame, Series } from './js-dataframes'; // Adjust path as needed

// From an array of objects (row-wise data)
const data1 = [
{ name: 'Alice', age: 30, city: 'New York' },
{ name: 'Bob', age: 24, city: 'London' },
{ name: 'Charlie', age: null, city: 'Paris' },
{ name: 'David', age: 30, city: 'New York' },
];
const df1 = new DataFrame(data1);
console.log("DataFrame df1:");
console.log(df1.toString());

// From an object of arrays (column-wise data) with a custom index
const data2 = {
product: ['Apple', 'Banana', 'Orange', 'Apple'],
price: [1.0, 0.5, 0.75, 1.2],
quantity: [100, 200, null, 150]
};
const df2 = new DataFrame(data2, { index: ['a', 'b', 'c', 'd'] });
console.log("\nDataFrame df2:");
console.log(df2.toString());

Data Selection
Label-based Selection with .loc()
// Select specific rows and columns by labels
const selectedDf2_loc = df2.loc(['b', 'd'], ['product', 'price']);
console.log("\nSelected from df2 using .loc:");
console.log(selectedDf2_loc.toString());

// Boolean indexing
const ageCondition = df1.get('age')?.values.map(age => age === 30) || [];
const filteredDf1 = df1.loc(ageCondition);
console.log("\nFiltered df1 where age is 30:");
console.log(filteredDf1.toString());

Position-based Selection with .iloc()
// Select rows by position and a specific column by position
const selectedDf2_iloc = df2.iloc([0, 2], 1); // Selects 'price' column for rows 0 and 2
console.log("\nSelected from df2 using .iloc:");
console.log(selectedDf2_iloc.toString());

Handling Missing Values
Filling Missing Values with .fillna()
// Fill null ages in df1 with 0
const df1_filled = df1.fillna(0);
console.log("\ndf1 after filling null ages with 0:");
console.log(df1_filled.toString());

Dropping Missing Values with .dropna()
// Drop rows containing any null values
const df1_dropped_rows = df1.dropna('rows');
console.log("\ndf1 after dropping rows with null values:");
console.log(df1_dropped_rows.toString());

// Drop columns containing any null values
const df2_dropped_cols = df2.dropna('columns');
console.log("\ndf2 after dropping columns with null values (quantity column should be dropped):");
console.log(df2_dropped_cols.toString());

```

## Accessing and Setting Columns

```javascript
// Access a single Series (column)
const citySeries = df1.get("city");
if (citySeries) {
  console.log("\n'city' Series from df1:");
  console.log(citySeries.toString());
}

// Set a new column
df1.set("isActive", [true, false, true, false]);
console.log("\ndf1 after adding 'isActive' column:");
console.log(df1.toString());
```

Placeholder Features
The prototype includes placeholders for more advanced features that would be part of a complete library:

```javascript
// Groupby (currently just logs a warning)
df1.groupby("city");

// merge, concat, astype, drop_duplicates (commented out in the code)
// DataFrame.readCsv, toCsv, fromArrow (for I/O and performance)
```

## Core Concepts

### Series

A Series is a one-dimensional labeled array capable of holding any data type (integers, strings, floats, Python objects, etc.). It has an index that labels each data point.

### DataFrame

A DataFrame is a two-dimensional labeled data structure with columns of potentially different types. You can think of it like a spreadsheet or SQL table, or a dictionary of Series objects. It is generally the most commonly used Pandas object.

### Future Enhancements (Roadmap)

To evolve this prototype into a robust library, the following areas would require significant development:

### Highly Optimized Internal Data Storage:

Full integration with Apache Arrow for efficient columnar data memory layout and inter-process communication.

Extensive use of Typed Arrays (Float64Array, Int32Array, etc.) for numerical data.

Comprehensive Type System: More sophisticated type inference and explicit type conversion (astype) with robust error handling.

### Advanced Indexing:

Implementation of MultiIndex for hierarchical indexing.

Dedicated DateTimeIndex for time-series operations.

### Full Pandas-like API:

Complete groupby functionality with various aggregation methods (sum, mean, median, min, max, std, var, apply, transform).

Robust merge, join, and concat operations for combining DataFrames.

Pivoting and melting data (pivot_table, melt).

Rolling windows and expanding operations for time-series analysis.

String methods, mathematical operations, statistical methods on Series and DataFrames.

### Performance Optimizations:

Deep integration of WebAssembly (Wasm) for computationally intensive tasks, potentially by writing core algorithms in Rust/C++ and compiling to Wasm.

Leveraging Web Workers to perform heavy data processing in background threads, keeping the main UI thread responsive.

Implementing vectorized operations wherever possible to avoid slow JavaScript loops.

### Robust I/O:

Efficient read_csv, read_json, read_excel (via external parsers), and read_sql (for Node.js) methods.

to_csv, to_json for exporting data.

### Error Handling and Validation:

Comprehensive input validation and meaningful error messages.

### Ecosystem Integration:

Seamless integration with popular JavaScript visualization libraries (D3.js, Chart.js, Plotly.js) and machine learning frameworks (TensorFlow.js).

### Documentation and Examples:

Extensive API documentation, tutorials, and practical examples.

### Contributing

Contributions are welcome! If you're interested in helping to build a comprehensive DataFrame library for JavaScript/TypeScript, please feel free to:

Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

### License

This project is licensed under the MIT License - see the LICENSE file for details.
