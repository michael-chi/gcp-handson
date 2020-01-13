using System;
using System.Data.SqlClient;

namespace sqlclient
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine(args[0]);
            var connString = args [0];
            Test(connString);
        }

        static void Test(string connString){
            using (var conn = new SqlConnection(connString)){
                conn.Open();
                using (var cmd = new SqlCommand("SELECT client_net_address FROM sys.dm_exec_connections WHERE Session_id = @@SPID;", conn))
                {
                    var result = cmd.ExecuteScalar();
                    Console.WriteLine($"Client IP: {result}");
                }
            }
        }
    }
}
