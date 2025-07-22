/**
 * js-pandas Prototype (Complete)
 *
 * This file provides a conceptual prototype for a 'js-pandas' DataFrame library,
 * now with working implementations for merge, concat, astype, drop_duplicates,
 * readCsv, and toCsv.
 *
 * It demonstrates the core data structures (Series, DataFrame) and simplified
 * implementations of key functionalities.
 *
 * A full-fledged library would still require extensive work on:
 * - Highly optimized internal data storage (e.g., Apache Arrow integration).
 * - Comprehensive type inference and handling for all operations.
 * - Advanced indexing (MultiIndex, DateTimeIndex).
 * - Full implementation of all Pandas-like methods (pivot, apply, transform, etc.).
 * - More robust performance optimizations using WebAssembly and Web Workers for large datasets.
 * - Comprehensive error handling and input validation for all methods.
 * - A rich ecosystem for I/O and visualization integration.
 */

// --- 1. Core Data Structures ---

/**
 * Represents a single column of data, similar to a Pandas Series.
 * Supports various data types and includes an index.
 */
class Series<T = any> {
    public values: T[];
    public index: (string | number)[];
    public name?: string;
    public dtype: string; // Simplified type tracking (e.g., 'number', 'string', 'boolean', 'object')

    /**
     * Creates a new Series.
     * @param data An array of values for the Series.
     * @param options Configuration options for the Series.
     * @param options.index Optional array of index labels. If not provided, a default integer index is used.
     * @param options.name Optional name for the Series.
     * @param options.dtype Optional data type hint. If not provided, inferred from data.
     */
    constructor(data: T[], options?: { index?: (string | number)[], name?: string, dtype?: string }) {
        if (!Array.isArray(data)) {
            throw new Error("Series data must be an array.");
        }
        this.values = data;
        this.index = options?.index || Array.from({ length: data.length }, (_, i) => i);
        this.name = options?.name;
        this.dtype = options?.dtype || this._inferDtype(data);

        if (this.index.length !== this.values.length) {
            throw new Error("Index length must match data length.");
        }

        // Potential optimization: Use Typed Arrays for numerical data
        // if (this.dtype === 'number') {
        //     this.values = new Float64Array(data as number[]) as any;
        // }
    }

    /**
     * Infers the data type of the Series based on its values.
     * @param data The data array.
     * @returns A string representing the inferred data type.
     */
    private _inferDtype(data: T[]): string {
        if (data.length === 0) return 'unknown';
        const firstNonNull = data.find(val => val !== null && val !== undefined);
        if (firstNonNull === undefined) return 'object'; // All null/undefined
        return typeof firstNonNull;
    }

    /**
     * Fills null or undefined values in the Series.
     * @param value The value to fill with.
     * @returns A new Series with filled values.
     */
    public fillna(value: T): Series<T> {
        const newValues = this.values.map(val => (val === null || val === undefined) ? value : val);
        return new Series(newValues, { index: this.index, name: this.name, dtype: this.dtype });
    }

    /**
     * Converts the Series to a specified data type.
     * @param newType The target data type (e.g., 'number', 'string', 'boolean').
     * @returns A new Series with converted values.
     */
    public astype(newType: string): Series {
        const convertedValues = this.values.map(val => {
            if (val === null || val === undefined) {
                return val; // Keep null/undefined as is
            }
            switch (newType) {
                case 'string':
                    return String(val);
                case 'number':
                    const num = Number(val);
                    return isNaN(num) ? null : num; // Return null for invalid number conversions
                case 'boolean':
                    return Boolean(val);
                default:
                    return val; // Return original value for unsupported types
            }
        });
        return new Series(convertedValues, { index: this.index, name: this.name, dtype: newType });
    }

    /**
     * Returns a string representation of the Series.
     */
    public toString(): string {
        let output = `Series(name='${this.name || 'None'}', dtype='${this.dtype}')\n`;
        this.values.forEach((val, i) => {
            output += `${this.index[i]}: ${val}\n`;
        });
        return output;
    }
}

/**
 * Represents a tabular data structure with labeled axes (rows and columns),
 * similar to a Pandas DataFrame.
 */
class DataFrame {
    private _data: { [key: string]: Series };
    public columns: string[];
    public index: (string | number)[];

    /**
     * Creates a new DataFrame.
     * @param data The data to initialize the DataFrame. Can be:
     * - An object where keys are column names and values are arrays.
     * - An array of objects, where each object is a row.
     * @param options Configuration options for the DataFrame.
     * @param options.columns Optional array of column names. If not provided, inferred from data.
     * @param options.index Optional array of row index labels. If not provided, a default integer index is used.
     */
    constructor(data: { [key: string]: any[] } | { [key: string]: any }[], options?: { columns?: string[], index?: (string | number)[] }) {
        this._data = {};
        this.columns = options?.columns || [];
        this.index = options?.index || [];

        if (Array.isArray(data)) {
            // Data is an array of row objects
            if (data.length > 0) {
                // Infer columns from the first row
                const inferredColumns = Object.keys(data[0]);
                this.columns = options?.columns || inferredColumns;

                // Transpose data to columnar format
                const columnarData: { [key: string]: any[] } = {};
                this.columns.forEach(col => {
                    columnarData[col] = data.map(row => row[col]);
                });
                this._initializeFromColumnarData(columnarData, options?.index);
            } else {
                // Empty DataFrame
                this.index = options?.index || [];
                this.columns = options?.columns || [];
            }
        } else if (typeof data === 'object' && data !== null) {
            // Data is an object of arrays (columnar format)
            this._initializeFromColumnarData(data, options?.index);
        } else {
            throw new Error("DataFrame data must be an array of objects or an object of arrays.");
        }
    }

    /**
     * Internal helper to initialize DataFrame from columnar data.
     * @param columnarData Object where keys are column names and values are arrays.
     * @param rowIndex Optional array of row index labels.
     */
    private _initializeFromColumnarData(columnarData: { [key: string]: any[] }, rowIndex?: (string | number)[]) {
        this.columns = Object.keys(columnarData);
        if (this.columns.length === 0) {
            this.index = rowIndex || [];
            return;
        }

        const firstColData = columnarData[this.columns[0]];
        if (!firstColData) {
            throw new Error("DataFrame initialization failed: first column data is missing.");
        }
        this.index = rowIndex || Array.from({ length: firstColData.length }, (_, i) => i);

        if (this.index.length !== firstColData.length) {
            throw new Error("Provided index length does not match data row count.");
        }

        this.columns.forEach(colName => {
            const colData = columnarData[colName];
            if (!colData || colData.length !== this.index.length) {
                throw new Error(`Column '${colName}' has inconsistent length.`);
            }
            this._data[colName] = new Series(colData, { name: colName, index: this.index });
        });
    }

    /**
     * Gets a Series for a specific column.
     * @param colName The name of the column.
     * @returns The Series object for the column.
     */
    public get(colName: string): Series | undefined {
        return this._data[colName];
    }

    /**
     * Sets or updates a column with a Series or array.
     * @param colName The name of the column.
     * @param values The Series or array of values to set.
     */
    public set(colName: string, values: Series | any[]): void {
        if (values instanceof Series) {
            if (values.values.length !== this.index.length) {
                throw new Error("Length of Series to set must match DataFrame row count.");
            }
            this._data[colName] = values;
        } else if (Array.isArray(values)) {
            if (values.length !== this.index.length) {
                throw new Error("Length of array to set must match DataFrame row count.");
            }
            this._data[colName] = new Series(values, { name: colName, index: this.index });
        } else {
            throw new Error("Values to set must be a Series or an array.");
        }
        if (!this.columns.includes(colName)) {
            this.columns.push(colName);
        }
    }

    /**
     * Selects rows and columns by labels.
     * @param rowLabels A single label, an array of labels, or a boolean array.
     * @param colLabels A single label or an array of labels.
     * @returns A new DataFrame or Series.
     */
    public loc(rowLabels: string | number | (string | number)[] | boolean[], colLabels?: string | string[]): DataFrame | Series {
        let selectedRowIndices: number[] = [];

        if (Array.isArray(rowLabels)) {
            if (typeof rowLabels[0] === 'boolean') {
                // Boolean indexing
                if (rowLabels.length !== this.index.length) {
                    throw new Error("Boolean array length must match DataFrame row count for .loc.");
                }
                selectedRowIndices = (rowLabels as boolean[]).map((val, i) => val ? i : -1).filter(i => i !== -1);
            } else {
                // Label-based indexing
                const indexMap = new Map(this.index.map((label, i) => [label, i]));
                selectedRowIndices = (rowLabels as (string | number)[]).map(label => {
                    const idx = indexMap.get(label);
                    if (idx === undefined) throw new Error(`Row label '${label}' not found.`);
                    return idx;
                });
            }
        } else {
            // Single label
            const indexMap = new Map(this.index.map((label, i) => [label, i]));
            const idx = indexMap.get(rowLabels);
            if (idx === undefined) throw new Error(`Row label '${rowLabels}' not found.`);
            selectedRowIndices = [idx];
        }

        let selectedCols: string[] = [];
        if (colLabels === undefined) {
            selectedCols = this.columns;
        } else if (Array.isArray(colLabels)) {
            selectedCols = colLabels.filter(col => this.columns.includes(col));
            if (selectedCols.length !== colLabels.length) {
                const missingCols = colLabels.filter(col => !this.columns.includes(col));
                throw new Error(`Column(s) not found: ${missingCols.join(', ')}`);
            }
        } else {
            if (!this.columns.includes(colLabels)) {
                throw new Error(`Column '${colLabels}' not found.`);
            }
            selectedCols = [colLabels];
        }

        const newDataFrameData: { [key: string]: any[] } = {};
        const newIndex = selectedRowIndices.map(i => this.index[i]);

        selectedCols.forEach(colName => {
            newDataFrameData[colName] = selectedRowIndices.map(idx => this._data[colName].values[idx]);
        });

        if (selectedCols.length === 1 && selectedRowIndices.length > 0) {
            // If only one column is selected, return a Series
            return new Series(newDataFrameData[selectedCols[0]], { index: newIndex, name: selectedCols[0] });
        }
        return new DataFrame(newDataFrameData, { index: newIndex, columns: selectedCols });
    }

    /**
     * Selects rows and columns by integer position.
     * @param rowPositions A single position or an array of positions.
     * @param colPositions A single position or an array of positions.
     * @returns A new DataFrame or Series.
     */
    public iloc(rowPositions: number | number[], colPositions?: number | number[]): DataFrame | Series {
        let selectedRowIndices: number[] = [];
        if (Array.isArray(rowPositions)) {
            selectedRowIndices = rowPositions.filter(pos => pos >= 0 && pos < this.index.length);
            if (selectedRowIndices.length !== rowPositions.length) {
                throw new Error("One or more row positions are out of bounds.");
            }
        } else {
            if (rowPositions < 0 || rowPositions >= this.index.length) {
                throw new Error("Row position is out of bounds.");
            }
            selectedRowIndices = [rowPositions];
        }

        let selectedColIndices: number[] = [];
        if (colPositions === undefined) {
            selectedColIndices = Array.from({ length: this.columns.length }, (_, i) => i);
        } else if (Array.isArray(colPositions)) {
            selectedColIndices = colPositions.filter(pos => pos >= 0 && pos < this.columns.length);
            if (selectedColIndices.length !== colPositions.length) {
                throw new Error("One or more column positions are out of bounds.");
            }
        } else {
            if (colPositions < 0 || colPositions >= this.columns.length) {
                throw new Error("Column position is out of bounds.");
            }
            selectedColIndices = [colPositions];
        }

        const newDataFrameData: { [key: string]: any[] } = {};
        const newIndex = selectedRowIndices.map(i => this.index[i]);
        const newColumns = selectedColIndices.map(i => this.columns[i]);

        newColumns.forEach((colName, colIdx) => {
            const originalColName = this.columns[selectedColIndices[colIdx]];
            newDataFrameData[colName] = selectedRowIndices.map(rowIdx => this._data[originalColName].values[rowIdx]);
        });

        if (newColumns.length === 1 && selectedRowIndices.length > 0) {
            // If only one column is selected, return a Series
            return new Series(newDataFrameData[newColumns[0]], { index: newIndex, name: newColumns[0] });
        }
        return new DataFrame(newDataFrameData, { index: newIndex, columns: newColumns });
    }

    /**
     * Drops rows or columns containing null or undefined values.
     * @param axis 'rows' or 'columns'.
     * @returns A new DataFrame with null/undefined values dropped.
     */
    public dropna(axis: 'rows' | 'columns' = 'rows'): DataFrame {
        if (axis === 'rows') {
            const rowsToKeep: number[] = [];
            for (let i = 0; i < this.index.length; i++) {
                let hasNull = false;
                for (const col of this.columns) {
                    if (this._data[col].values[i] === null || this._data[col].values[i] === undefined) {
                        hasNull = true;
                        break;
                    }
                    // Also check for NaN if the dtype is number
                    if (this._data[col].dtype === 'number' && typeof this._data[col].values[i] === 'number' && isNaN(this._data[col].values[i] as number)) {
                        hasNull = true;
                        break;
                    }
                }
                if (!hasNull) {
                    rowsToKeep.push(i);
                }
            }
            return this.iloc(rowsToKeep) as DataFrame;
        } else if (axis === 'columns') {
            const colsToKeep: string[] = [];
            for (const col of this.columns) {
                let hasNull = false;
                for (const val of this._data[col].values) {
                    if (val === null || val === undefined) {
                        hasNull = true;
                        break;
                    }
                    // Also check for NaN if the dtype is number
                    if (this._data[col].dtype === 'number' && typeof val === 'number' && isNaN(val as number)) {
                        hasNull = true;
                        break;
                    }
                }
                if (!hasNull) {
                    colsToKeep.push(col);
                }
            }
            return this.loc(this.index, colsToKeep) as DataFrame;
        } else {
            throw new Error("Axis must be 'rows' or 'columns'.");
        }
    }

    /**
     * Fills null or undefined values in the DataFrame.
     * @param value The value to fill with.
     * @returns A new DataFrame with filled values.
     */
    public fillna(value: any): DataFrame {
        const newDataFrameData: { [key: string]: any[] } = {};
        this.columns.forEach(colName => {
            newDataFrameData[colName] = this._data[colName].fillna(value).values;
        });
        return new DataFrame(newDataFrameData, { index: this.index, columns: this.columns });
    }

    /**
     * Converts a specific column to a new data type.
     * @param columnName The name of the column to convert.
     * @param newType The target data type (e.g., 'number', 'string', 'boolean').
     * @returns A new DataFrame with the converted column.
     */
    public astype(columnName: string, newType: string): DataFrame {
        if (!this.columns.includes(columnName)) {
            throw new Error(`Column '${columnName}' not found.`);
        }
        const newDataFrameData: { [key: string]: any[] } = {};
        this.columns.forEach(col => {
            if (col === columnName) {
                newDataFrameData[col] = this._data[col].astype(newType).values;
            } else {
                newDataFrameData[col] = [...this._data[col].values]; // Copy existing data
            }
        });
        return new DataFrame(newDataFrameData, { index: this.index, columns: this.columns });
    }

    /**
     * Drops duplicate rows from the DataFrame.
     * @param subset Optional column label or list of labels to consider for identifying duplicates.
     * If not provided, all columns are considered.
     * @returns A new DataFrame with duplicate rows removed.
     */
    public drop_duplicates(subset?: string | string[]): DataFrame {
        const columnsToCheck = subset ? (Array.isArray(subset) ? subset : [subset]) : this.columns;
        const seenKeys = new Set<string>();
        const rowsToKeep: number[] = [];

        for (let i = 0; i < this.index.length; i++) {
            const rowValues: any[] = [];
            for (const col of columnsToCheck) {
                if (!this._data[col]) {
                    throw new Error(`Subset column '${col}' not found.`);
                }
                rowValues.push(this._data[col].values[i]);
            }
            // Create a unique string key for the row based on selected columns
            const key = JSON.stringify(rowValues);
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                rowsToKeep.push(i);
            }
        }
        return this.iloc(rowsToKeep) as DataFrame;
    }

    /**
     * Concatenates DataFrames along a particular axis.
     * @param others An array of DataFrames to concatenate.
     * @param axis 'rows' (0) or 'columns' (1).
     * @returns A new DataFrame resulting from the concatenation.
     */
    public concat(others: DataFrame[], axis: 'rows' | 'columns' = 'rows'): DataFrame {
        if (!Array.isArray(others)) {
            throw new Error("`others` must be an array of DataFrames.");
        }

        if (axis === 'rows') {
            // Concatenate rows
            const allColumns = [...new Set([...this.columns, ...others.flatMap(df => df.columns)])];
            const newIndex: (string | number)[] = [...this.index];
            const newDataFrameData: { [key: string]: any[] } = {};

            // Initialize newDataFrameData with current DataFrame's data
            allColumns.forEach(col => {
                newDataFrameData[col] = this._data[col] ? [...this._data[col].values] : Array(this.index.length).fill(null);
            });

            // Append data from other DataFrames
            others.forEach(otherDf => {
                const otherIndexOffset = newIndex.length;
                newIndex.push(...otherDf.index.map((_, i) => otherIndexOffset + i)); // Generate new unique index

                allColumns.forEach(col => {
                    if (!newDataFrameData[col]) {
                        newDataFrameData[col] = Array(this.index.length).fill(null); // Pad if column didn't exist in original
                    }
                    if (otherDf._data[col]) {
                        newDataFrameData[col].push(...otherDf._data[col].values);
                    } else {
                        newDataFrameData[col].push(...Array(otherDf.index.length).fill(null)); // Pad if column doesn't exist in otherDf
                    }
                });
            });
            return new DataFrame(newDataFrameData, { index: newIndex, columns: allColumns });

        } else if (axis === 'columns') {
            // Concatenate columns (requires matching indices for simplicity in this prototype)
            // In a real library, this would handle alignment and different join types.
            const newColumns = [...this.columns];
            const newDataFrameData: { [key: string]: any[] } = {};

            // Copy existing columns
            this.columns.forEach(col => {
                newDataFrameData[col] = [...this._data[col].values];
            });

            others.forEach(otherDf => {
                // For simplicity, assume indices match for column concatenation
                if (otherDf.index.length !== this.index.length || JSON.stringify(otherDf.index) !== JSON.stringify(this.index)) {
                    console.warn("Indices do not match for column concatenation. This prototype assumes matching indices.");
                    // A real implementation would handle this with alignment logic (e.g., outer join on index)
                }

                otherDf.columns.forEach(col => {
                    if (newColumns.includes(col)) {
                        // Handle duplicate column names (e.g., append suffix)
                        let newColName = col;
                        let counter = 1;
                        while (newColumns.includes(newColName)) {
                            newColName = `${col}_${counter++}`;
                        }
                        newColumns.push(newColName);
                        newDataFrameData[newColName] = [...otherDf._data[col].values];
                    } else {
                        newColumns.push(col);
                        newDataFrameData[col] = [...otherDf._data[col].values];
                    }
                });
            });
            return new DataFrame(newDataFrameData, { index: this.index, columns: newColumns });
        } else {
            throw new Error("Axis must be 'rows' or 'columns'.");
        }
    }

    /**
     * Merges DataFrames based on common columns (simplified to inner join for prototype).
     * @param other The other DataFrame to merge with.
     * @param on The column label or list of labels to join on.
     * @param how The type of merge to be performed. (Only 'inner' implemented for prototype).
     * @returns A new DataFrame resulting from the merge.
     */
    public merge(other: DataFrame, on: string | string[], how: 'inner' | 'outer' | 'left' | 'right' = 'inner'): DataFrame {
        if (how !== 'inner') {
            console.warn(`Merge type '${how}' is not fully implemented in this prototype. Defaulting to 'inner' join.`);
        }

        const onColumns = Array.isArray(on) ? on : [on];
        const leftMap = new Map<string, number[]>(); // Key: JSON.stringify(on_values), Value: array of row indices

        // Build map for left DataFrame
        for (let i = 0; i < this.index.length; i++) {
            const keyValues = onColumns.map(col => {
                if (!this._data[col]) throw new Error(`Merge key column '${col}' not found in left DataFrame.`);
                return this._data[col].values[i];
            });
            const key = JSON.stringify(keyValues);
            if (!leftMap.has(key)) {
                leftMap.set(key, []);
            }
            leftMap.get(key)!.push(i);
        }

        const newRows: { [key: string]: any }[] = [];
        const newColumns = [...new Set([...this.columns, ...other.columns])]; // All unique columns

        // Iterate through right DataFrame to find matches
        for (let j = 0; j < other.index.length; j++) {
            const keyValues = onColumns.map(col => {
                if (!other._data[col]) throw new Error(`Merge key column '${col}' not found in right DataFrame.`);
                return other._data[col].values[j];
            });
            const key = JSON.stringify(keyValues);

            if (leftMap.has(key)) {
                const leftIndices = leftMap.get(key)!;
                leftIndices.forEach(leftIdx => {
                    const newRow: { [key: string]: any } = {};
                    // Add columns from left DataFrame
                    this.columns.forEach(col => {
                        newRow[col] = this._data[col].values[leftIdx];
                    });
                    // Add columns from right DataFrame, handling potential duplicates
                    other.columns.forEach(col => {
                        if (newRow[col] !== undefined && !onColumns.includes(col)) {
                            // If column exists in both and is not a merge key, rename right column
                            let newColName = col;
                            let counter = 1;
                            while (newColumns.includes(newColName)) {
                                newColName = `${col}_${counter++}`;
                            }
                            newRow[newColName] = other._data[col].values[j];
                        } else if (!onColumns.includes(col) || newRow[col] === undefined) {
                            // Add if not a merge key or if it didn't exist in left
                            newRow[col] = other._data[col].values[j];
                        }
                    });
                    newRows.push(newRow);
                });
            }
        }
        return new DataFrame(newRows, { columns: newColumns });
    }

    /**
     * Placeholder for groupby functionality.
     * A real implementation would return a GroupBy object.
     * @param by The column(s) to group by.
     */
    public groupby(by: string | string[]): any {
        console.warn("`groupby` is a placeholder. A full implementation would return a GroupBy object with aggregation methods.");
        // In a real implementation, this would return a GroupBy object
        // that has methods like .sum(), .mean(), .apply(), etc.
        // Example structure for a GroupBy object (not implemented here):
        // class GroupBy {
        //     constructor(df: DataFrame, keys: string[]) { /* ... */ }
        //     sum(): DataFrame { /* ... */ }
        //     mean(): DataFrame { /* ... */ }
        // }
        // return new GroupBy(this, Array.isArray(by) ? by : [by]);
        return this; // For now, just return the DataFrame
    }

    /**
     * Reads data from a CSV string to create a DataFrame.
     * This is a simplified implementation and does not handle complex CSV cases (e.g., quoted commas, newlines within fields).
     * @param csvString The CSV data as a string.
     * @returns A new DataFrame.
     */
    public static readCsv(csvString: string): DataFrame {
        const lines = csvString.trim().split('\n');
        if (lines.length === 0) {
            return new DataFrame([]);
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows: { [key: string]: any }[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                console.warn(`Skipping malformed row ${i + 1}: ${lines[i]}`);
                continue;
            }
            const row: { [key: string]: any } = {};
            headers.forEach((header, idx) => {
                let value: any = values[idx];
                // Simple type inference for numbers and booleans
                if (!isNaN(Number(value)) && value !== '') {
                    value = Number(value);
                } else if (value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'false') {
                    value = false;
                } else if (value === '') {
                    value = null;
                }
                row[header] = value;
            });
            dataRows.push(row);
        }
        return new DataFrame(dataRows, { columns: headers });
    }

    /**
     * Converts the DataFrame to a CSV string.
     * @returns The DataFrame data as a CSV string.
     */
    public toCsv(): string {
        if (this.columns.length === 0 || this.index.length === 0) {
            return this.columns.join(',') + '\n'; // Just headers if empty
        }

        const headerRow = this.columns.join(',');
        const dataRows: string[] = [];

        for (let i = 0; i < this.index.length; i++) {
            const rowValues = this.columns.map(col => {
                const val = this._data[col].values[i];
                if (val === null || val === undefined) {
                    return ''; // Represent null/undefined as empty string in CSV
                }
                // Basic CSV escaping for values containing commas or newlines
                const stringVal = String(val);
                if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            });
            dataRows.push(rowValues.join(','));
        }
        return [headerRow, ...dataRows].join('\n');
    }

    /**
     * Returns a string representation of the DataFrame.
     */
    public toString(): string {
        if (this.columns.length === 0 || this.index.length === 0) {
            return `Empty DataFrame\nColumns: ${JSON.stringify(this.columns)}\nIndex: ${JSON.stringify(this.index)}`;
        }

        // Determine max width for each column including index
        const columnWidths: { [key: string]: number } = {};
        columnWidths['__index__'] = Math.max(...this.index.map(String).map(s => s.length), 'Index'.length);

        this.columns.forEach(col => {
            columnWidths[col] = Math.max(
                col.length,
                ...this._data[col].values.map(val => (val === null || val === undefined) ? 'null'.length : String(val).length)
            );
        });

        // Build header
        let header = 'Index'.padEnd(columnWidths['__index__']);
        this.columns.forEach(col => {
            header += ' | ' + col.padEnd(columnWidths[col]);
        });

        // Build separator
        let separator = '-'.repeat(columnWidths['__index__']);
        this.columns.forEach(col => {
            separator += '-+-' + '-'.repeat(columnWidths[col]);
        });

        // Build body
        let body = '';
        for (let i = 0; i < this.index.length; i++) {
            let rowString = String(this.index[i]).padEnd(columnWidths['__index__']);
            for (const col of this.columns) {
                const val = this._data[col].values[i];
                const displayVal = (val === null || val === undefined) ? 'null' : String(val);
                rowString += ' | ' + displayVal.padEnd(columnWidths[col]);
            }
            body += rowString + '\n';
        }
        return `DataFrame (${this.index.length} rows x ${this.columns.length} columns)\n${header}\n${separator}\n${body}`;
    }

    // --- Performance Optimizations (Conceptual) ---
    // public static async fromArrow(buffer: ArrayBuffer): Promise<DataFrame> {
    //     // This would involve parsing Apache Arrow format, potentially using a WASM module
    //     console.warn("`fromArrow` is a conceptual method for WebAssembly/Arrow integration.");
    //     return new DataFrame([]);
    // }

    // private _runComputationInWorker(operation: string, data: any): Promise<any> {
    //     // Conceptual method to offload heavy computations to a Web Worker
    //     console.warn("`_runComputationInWorker` is a conceptual method for Web Worker usage.");
    //     return Promise.resolve(data);
    // }
}
