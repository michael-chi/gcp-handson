// Copyright 2015 gRPC authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System;
using Grpc.Core;
using Helloworld;
using System.Threading.Tasks;
namespace GreeterClient
{
    class Program
    {
        public static void Main(string[] args)
        {
            var remote = Environment.GetEnvironmentVariable("remote");
            if(String.IsNullOrEmpty(remote)){
                remote = "127.0.0.1:80";
            }
            Channel channel = null;
            while(true){
                try{
                    Console.WriteLine($"remote={remote}");
                    channel = new Channel(remote, ChannelCredentials.Insecure);

                    var client = new Greeter.GreeterClient(channel);
                    String user = "you";

                    var reply = client.SayHello(new HelloRequest { Name = user });
                    Console.WriteLine("Greeting: " + reply.Message);
                }
                catch(Exception ex){
                    Console.WriteLine($"Exception:{ex.Message}");
                }
                Task.Delay(1000).Wait();
            }
            channel.ShutdownAsync().Wait();
        }
    }
}
