from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.authentication import BasicAuthentication
from rest_framework.parsers import MultiPartParser, FormParser

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from .models import Note
from .serializers import NoteSerializer


@method_decorator(csrf_exempt, name="dispatch")
class NoteListCreate(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [AllowAny]

    # 🔥 THIS IS THE FIX
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        search = request.GET.get("search", "")
        notes = Note.objects.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        ).order_by("-uploaded_at")

        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class NoteDetail(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        note = get_object_or_404(Note, pk=pk)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@csrf_exempt
def download_note(request, pk):
    note = get_object_or_404(Note, pk=pk)
    return FileResponse(
        note.file.open(),
        as_attachment=True,
        filename=note.file.name.split("/")[-1]
    )
