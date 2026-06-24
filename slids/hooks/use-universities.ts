"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { University } from "@/slids/types/index";
import { UniversityFormValues } from "@/lib/university-schema";

export interface UseUniversitiesParams {
  search?: string;
  status?: string;
  countryId?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UniversitiesResponse {
  success: boolean;
  data: University[];
  meta?: PaginationMeta;
}

export function useUniversities(params?: UseUniversitiesParams) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUniversities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get<UniversitiesResponse>(
        "/api/universities",
        {
          params,
        }
      );

      setUniversities(response.data.data ?? []);
      setMeta(response.data.meta ?? null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch universities"
      );
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const addUniversity = async (
    university: UniversityFormValues
  ) => {
    const response = await axios.post(
      "/api/universities",
      university
    );

    await fetchUniversities();

    return response.data.data;
  };

  const updateUniversity = async (
    id: string,
    data: UniversityFormValues
  ) => {
    const response = await axios.put(
      `/api/universities/${id}`,
      data
    );

    await fetchUniversities();

    return response.data.data;
  };

  const deleteUniversity = async (id: string) => {
    const response = await axios.delete(
      `/api/universities/${id}`
    );

    await fetchUniversities();

    return response.data.data;
  };

  return {
    universities,
    meta,
    isLoading,
    error,
    refetch: fetchUniversities,
    addUniversity,
    updateUniversity,
    deleteUniversity,
  };
}