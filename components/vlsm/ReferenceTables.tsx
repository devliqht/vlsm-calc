"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const ReferenceTables = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Powers of 2 Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Powers of 2 Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Power</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((power) => (
                <TableRow key={power}>
                  <TableCell>
                    2<sup>{power}</sup>
                  </TableCell>
                  <TableCell>{Math.pow(2, power).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Byte Values Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Byte Values Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Binary</TableHead>
                <TableHead>Decimal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">10000000</TableCell>
                <TableCell>128</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11000000</TableCell>
                <TableCell>192</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11100000</TableCell>
                <TableCell>224</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11110000</TableCell>
                <TableCell>240</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11111000</TableCell>
                <TableCell>248</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11111100</TableCell>
                <TableCell>252</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11111110</TableCell>
                <TableCell>254</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">11111111</TableCell>
                <TableCell>255</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
