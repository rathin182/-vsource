import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useCounselors = () => {
  return useQuery({
    queryKey: ["counselors"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/counselors`,
        {
          withCredentials: true,
        },
      );

      return data?.data || [];
    },
  });
};
