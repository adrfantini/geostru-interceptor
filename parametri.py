#!/usr/bin/env python3

import csv
import re
import chardet

FILE_PATH = './report.txt'

def detect_encoding(file_path):
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read())
    return result['encoding']

# Open the report.txt file with the right encoding
encoding = detect_encoding(FILE_PATH)
with open(FILE_PATH, 'r', encoding=encoding) as file:
    lines = file.readlines()

# Find the start and end of the "Parametri sismici" section
start = next(i for i, line in enumerate(lines) if 'Parametri' in line and (i != 0))
# Find the end of the "Parametri sismici" section
end = next(i for i, line in enumerate(lines[start+1:]) if not re.match(r'^\s', line)) + start + 1

print(start, end)

# Extract the "Parametri sismici" section
section = lines[start+1:end]

# Prepare the data for CSV
data = []
for line in section:
    # Use regex to extract the data
    match = re.match(r'\tSito (\d)\tID: (\d+)\tLat: ([\d,]+)\tLon: ([\d,]+)\tDistanza: ([\d,]+)', line)
    if match:
        data.append(match.groups())

# Write the data to a CSV file
with open('output.csv', 'w', newline='', encoding=encoding) as file:
    writer = csv.writer(file)
    writer.writerow(['', 'Prob. superamento (%)', 'Tr (anni)', 'ag (g)', 'Fo (-)', 'Tc (s)'])  # Write the header
    writer.writerows(data)  # Write the data
