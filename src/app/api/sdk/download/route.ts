export async function GET(request: Request) {
  return Response.redirect(
    new URL("/cadastro?next=%2Fapps%2Fnovo", request.url),
    307,
  );
}
