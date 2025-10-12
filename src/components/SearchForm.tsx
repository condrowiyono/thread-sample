"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import useLocalStorageState from "use-local-storage-state";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  query: z.string().min(1, {
    message: "Query is required.",
  }),
  curlCommand: z.string().min(1, {
    message: "Curl command is required.",
  }),
  loopCount: z.number().min(1, {
    message: "Loop count must be at least 1.",
  }),
  pageSize: z.number(),
});

export type SearchFormValues = z.infer<typeof formSchema>;

interface SearchFormProps {
  onSubmit: (values: SearchFormValues) => void;
  onReset: () => void;
  loading: boolean;
}

const defaultFormValues: SearchFormValues = {
  query: "",
  curlCommand: "",
  loopCount: 1,
  pageSize: 10,
};

export default function SearchForm({
  onSubmit,
  onReset,
  loading,
}: SearchFormProps) {
  // Use localStorage to persist form values
  const [savedFormValues, setSavedFormValues] = useLocalStorageState<SearchFormValues>(
    "thread-search-form",
    {
      defaultValue: defaultFormValues,
    }
  );

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  // Load saved values from localStorage on mount and when savedFormValues changes
  useEffect(() => {
    if (savedFormValues) {
      form.reset(savedFormValues);
    }
  }, [savedFormValues, form]);

  const handleSubmit = (values: SearchFormValues) => {
    // Save to localStorage on submit
    setSavedFormValues(values);
    onSubmit(values);
  };

  const handleReset = () => {
    form.reset(defaultFormValues);
    setSavedFormValues(defaultFormValues);
    onReset();
  };

  return (
    <div className="p-10 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Thread Search Extractor</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Query</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your query" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="curlCommand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Curl Command</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste your curl command here"
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="loopCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loop Count</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter loop count"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pageSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Size</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter page size"
                    disabled
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
          <Button type="reset" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
        </form>
      </Form>
    </div>
  );
}
