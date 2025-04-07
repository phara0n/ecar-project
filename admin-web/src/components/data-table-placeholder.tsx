import { ColumnsIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DataTablePlaceholder() {
  return (
    <Tabs defaultValue="main" className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="@4xl/main:flex">
          <TabsTrigger value="main">Main View</TabsTrigger>
          <TabsTrigger value="secondary">Secondary View</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ColumnsIcon className="mr-2 h-4 w-4" />
            <span>Columns</span>
          </Button>
          <Button variant="outline" size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>
      <TabsContent value="main" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">Item {index + 1}</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>{new Date().toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end px-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="secondary" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Secondary view content will appear here</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

